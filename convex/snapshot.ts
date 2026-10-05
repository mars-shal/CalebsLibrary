// Bells Notes — Upstash read snapshot.
//
// WHY THIS EXISTS
// The web app used to run `catalogue.get` (a full `.collect()` of every row,
// 34 fields each) plus `metrics.getAll` and `trends.getTop` — every 30 seconds,
// per open tab, forever. On the Convex Free plan that is the whole data-egress
// budget gone in a single afternoon, and Free is a hard cap: once it is hit the
// deployment starts returning HTTP errors on function calls.
//
// So the direction is: Convex stays the source of truth for every WRITE (it is
// the only thing that gives us OCC, transactions, indexes and reactive queries),
// and this module maintains a *derived* read model in Upstash Redis. The web app
// reads the snapshot from a Vercel function instead of asking Convex for it,
// which takes the catalogue reads and the egress bytes off Convex entirely.
//
// This is deliberately NOT a write buffer. Nothing authoritative lives in Redis.
// If Redis is empty, stale, or unreachable, the Vercel function falls through to
// Convex and the app keeps working — Redis is an optimisation, never a
// dependency. A daily cron (`verify`) rebuilds from Convex and repairs drift,
// which also keeps the database active: Upstash archives free-tier databases
// after 30 days of inactivity, and a snapshot written only on a 3-day Drive sync
// would sit right on that line.
//
// KEYS (2, written in one MSET = 1 command per refresh, both with a 30-day TTL)
//   cl:cat   the whole read model as one JSON blob — version, generatedAt,
//            papers, metrics, trends. One key because the client always wants
//            the whole thing; there is no partial read worth optimising.
//   cl:ver   the integer version, and nothing else. Kept separate *only* so the
//            client's version probe costs one ~8-byte GET instead of pulling the
//            entire catalogue. This is the single most valuable key in the
//            design and the reason it is not folded into cl:cat.
import { Redis } from "@upstash/redis";
import { v } from "convex/values";
import {
  env,
  internalAction,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { buildSummary } from "../src/schema/catalogue";

// `cl:sha` and `cl:meta` from the first draft are gone: the ETag is just the
// version, and count/generatedAt/refreshCount all live inside the payload.
const SNAPSHOT_KEY = "cl:cat";
const VERSION_KEY = "cl:ver";

// Upstash archives free-tier databases after 30 days of inactivity. A 30-day
// TTL gives exactly that margin: even if every cron stopped, the cache would
// expire cleanly rather than being frozen at a stale value. The daily verify
// cron refreshes the TTL anyway, so in practice this is a safety net.
const TTL_SECONDS = 30 * 24 * 60 * 60;

// A catalogue change should be visible on the web within a couple of minutes,
// but the Drive source only moves every 3 days and a moderation approval is
// rare — so coalesce refresh triggers into one rebuild per 15 minutes. This is
// what stops the snapshot's own full-table read from becoming the new I/O
// problem it is meant to solve.
const REFRESH_DEBOUNCE_MS = 15 * 60 * 1000;

// Rows in the catalogue that must exist before a refresh is worth doing at all.
const MIN_PAPERS = 1;

/**
 * 32-bit FNV-1a, doubled with a different offset basis and mixed with the
 * payload length. We only need "did this change?", so a fast non-cryptographic
 * hash is the right tool — `crypto.subtle` is unavailable in the default
 * Convex runtime and this file also exports queries, so it cannot use
 * `"use node"`.
 */
function contentHash(input: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b + c + i, 0x85ebca6b) >>> 0;
  }
  const mix = (a ^ b) >>> 0;
  return `${mix.toString(16).padStart(8, "0")}${(b >>> 0)
    .toString(16)
    .padStart(8, "0")}${(input.length >>> 0).toString(16)}`;
}

/**
 * The read model. Every field the Vue store or a view actually touches is
 * included; anything not here is not sent to the browser.
 *
 * `parents` is deliberately absent — the schema has carried it as dead weight
 * since the v2 Drive rewrite and no client reads it. It is a Drive folder-path
 * array riding along on every row of every read for nobody.
 */
export const snapshotPayloadValidator = v.object({
  generatedAt: v.number(),
  papers: v.array(v.any()),
  metrics: v.array(v.any()),
  trends: v.array(v.any()),
});

async function redisClient(): Promise<Redis | null> {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

type RefreshResult = {
  status: "written" | "unchanged" | "debounced" | "skipped-no-config" | "error";
  version: number;
  count: number;
  sha: string | null;
  error: string | null;
};

/**
 * Read everything the read model needs in one pass, and drop the fields that
 * never reach a client. This is the only full-table read in the system, and it
 * happens at most once per REFRESH_DEBOUNCE_MS.
 */
export const buildPayload = internalQuery({
  args: { now: v.number() },
  returns: v.object({
    generatedAt: v.number(),
    papers: v.array(v.any()),
    metrics: v.array(v.any()),
    trends: v.array(v.any()),
    summary: v.any(),
  }),
  handler: async (ctx, args) => {
    const [catalogue, metrics, trendRows] = await Promise.all([
      ctx.db.query("catalogue").collect(),
      ctx.db.query("metrics").collect(),
      ctx.db.query("searchTrends").collect(),
    ]);

    // Fields excluded from the wire format, per the note above.
    const papers = catalogue.map((row) => {
      const { parents, ...rest } = row;
      void parents;
      return rest;
    });

    // `trends.getTop` scores rows by decayed recency, which needs a wall-clock
    // read. A query may not read the clock, so the timestamp is taken by the
    // calling action and passed in — otherwise this query would be
    // nondeterministic and Convex would reject it.
    const { now } = args;
    const trends = trendRows
      .map((row) => ({
        term: row.term,
        score: decayedScore(row.count, row.updated_at, now),
      }))
      .filter((t) => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    return {
      generatedAt: now,
      papers,
      // Catalogue-wide totals, computed here over every paper so they can ride
      // along with each paged response. The client only ever holds one page at
      // a time, and would otherwise report its own page size as the library
      // size. ~300 bytes, so it is cheaper than another round-trip.
      summary: buildSummary(papers),
      metrics: metrics.map((m) => ({
        paper_id: m.paper_id,
        reads: m.reads,
        downloads: m.downloads,
        upvotes: m.upvotes,
        downvotes: m.downvotes,
      })),
      trends,
    };
  },
});

const DAY_MS = 86_400_000;
// Mirrors convex/trends.ts so the snapshot and the live query rank identically.
function decayedScore(count: number, updatedAt: number, now: number): number {
  const ageDays = Math.max(0, (now - updatedAt) / DAY_MS);
  return count * Math.exp(-ageDays / 7);
}

/**
 * Atomically decide whether this caller owns the next refresh.
 *
 * The guard reads `lastAttemptAt`, which this mutation writes itself. That is
 * what makes the claim genuinely exclusive: the write to the singleton row
 * conflicts under OCC, Convex retries the loser, and the retry sees a fresh
 * `lastAttemptAt` and declines.
 *
 * It used to guard on `lastRefreshAt`, which only `completeRefresh` writes at
 * the very end. Both concurrent callers therefore read a stale value, both
 * claimed, and both ran the full-table read — the exact duplicate work the
 * debounce exists to prevent. `failRefresh` releases the lock so a transient
 * Redis outage does not lock the snapshot out for the full window.
 *
 * The version is NOT bumped here — it only moves when the content genuinely
 * changes, so an unchanged rebuild does not invalidate every client's copy.
 */
export const claimRefresh = internalMutation({
  args: { minIntervalMs: v.number() },
  returns: v.object({
    claimed: v.boolean(),
    version: v.number(),
    sha: v.union(v.string(), v.null()),
    count: v.number(),
    refreshCount: v.number(),
  }),
  handler: async (ctx, { minIntervalMs }) => {
    const now = Date.now();
    const meta = await ctx.db.query("snapshotMeta").first();

    if (!meta) {
      await ctx.db.insert("snapshotMeta", { lastAttemptAt: now, version: 0, count: 0 });
      return {
        claimed: true,
        version: 0,
        sha: null,
        count: 0,
        refreshCount: 0,
      };
    }

    const last = meta.lastAttemptAt ?? 0;
    if (now - last < minIntervalMs) {
      return {
        claimed: false,
        version: meta.version ?? 0,
        sha: meta.sha ?? null,
        count: meta.count ?? 0,
        refreshCount: meta.refreshCount ?? 0,
      };
    }

    await ctx.db.patch(meta._id, { lastAttemptAt: now });
    return {
      claimed: true,
      version: meta.version ?? 0,
      sha: meta.sha ?? null,
      count: meta.count ?? 0,
      refreshCount: meta.refreshCount ?? 0,
    };
  },
});

export const completeRefresh = internalMutation({
  args: {
    sha: v.string(),
    count: v.number(),
    changed: v.boolean(),
    version: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { sha, count, changed, version }) => {
    const now = Date.now();
    const meta = await ctx.db.query("snapshotMeta").first();
    if (!meta) {
      await ctx.db.insert("snapshotMeta", {
        lastAttemptAt: now,
        lastRefreshAt: now,
        lastVerifiedAt: now,
        version,
        refreshCount: 1,
        count,
        sha,
      });
      return null;
    }
    await ctx.db.patch(meta._id, {
      lastRefreshAt: now,
      lastVerifiedAt: now,
      refreshCount: (meta.refreshCount ?? 0) + 1,
      count,
      sha,
      // Only advance the version when the bytes actually differ — this is what
      // lets the client poll cheaply and skip the download on a 304.
      ...(changed ? { version } : {}),
      lastError: undefined,
    });
    return null;
  },
});

export const failRefresh = internalMutation({
  args: { error: v.string() },
  returns: v.null(),
  handler: async (ctx, { error }) => {
    const meta = await ctx.db.query("snapshotMeta").first();
    if (!meta) {
      await ctx.db.insert("snapshotMeta", { lastAttemptAt: 0, lastError: error });
      return null;
    }
    // Release the claim. The guard reads lastAttemptAt, so without this a single
    // failed attempt would suppress every refresh for the full debounce window
    // and the library would serve stale data until the daily verify turned up.
    await ctx.db.patch(meta._id, { lastAttemptAt: 0, lastError: error });
    return null;
  },
});

/**
 * Build the read model and, if it differs from what Redis already holds, write
 * it back. Shared by `refresh` (debounced, triggered by catalogue mutations)
 * and `verify` (forced, daily cron).
 */
async function doRefresh(
  ctx: ActionCtx,
  opts: { force: boolean; minIntervalMs: number },
): Promise<RefreshResult> {
  const redis = await redisClient();
  if (!redis) {
    // Not provisioned yet. The Vercel function falls through to Convex, so this
    // is a degraded-but-correct state, not a failure.
    return { status: "skipped-no-config", version: 0, count: 0, sha: null, error: null };
  }

  const claim: {
    claimed: boolean;
    version: number;
    sha: string | null;
    count: number;
    refreshCount: number;
  } = await ctx.runMutation(internal.snapshot.claimRefresh, {
    minIntervalMs: opts.force ? 0 : opts.minIntervalMs,
  });

  if (!claim.claimed) {
    return {
      status: "debounced",
      version: claim.version,
      count: claim.count,
      sha: claim.sha,
      error: null,
    };
  }

  try {
    // Actions may read the wall clock; queries may not. Take the timestamp here
    // and hand it to the query so its output is deterministic.
    const payload = await ctx.runQuery(internal.snapshot.buildPayload, { now: Date.now() });
    if (payload.papers.length < MIN_PAPERS) {
      throw new Error(
        `Refusing to publish an empty snapshot (${payload.papers.length} papers) — that would blank the library.`,
      );
    }

    // Hash the CONTENT, not the envelope. `generatedAt` is Date.now(), so
    // hashing the whole payload made every rebuild look like a change: the
    // "unchanged" branch below could never fire, the version incremented on
    // every write, and every client poll got a full 200 with the entire
    // catalogue instead of a 204. That silently defeated the version probe.
    const { generatedAt: _generatedAt, ...content } = payload;
    const sha = contentHash(JSON.stringify(content));

    if (sha === claim.sha) {
      // Content is identical, so the stored payload is still correct: do NOT
      // rewrite it (that would churn the ETag and every client's cache) and do
      // NOT bump the version.
      //
      // But do refresh the TTL. Without this, a library nobody edits for 30 days
      // would let the cache expire and quietly fall back to the slow Convex
      // path — the one scenario the cache exists to avoid. Two EXPIRE commands
      // is a trivial price for staying warm.
      await redis.expire(SNAPSHOT_KEY, TTL_SECONDS);
      await redis.expire(VERSION_KEY, TTL_SECONDS);

      await ctx.runMutation(internal.snapshot.completeRefresh, {
        sha,
        count: payload.papers.length,
        changed: false,
        version: claim.version,
      });
      return {
        status: "unchanged",
        version: claim.version,
        count: payload.papers.length,
        sha,
        error: null,
      };
    }

    const version = claim.version + 1;

    // Two keys, written together, both with a long TTL. MSET cannot set a TTL,
    // so this is 1 MSET + 2 EXPIRE = 3 commands per *content change*. That is
    // fine because content changes are rare — the 15-minute debounce means the
    // common refresh path returns at the `unchanged` branch above without
    // touching Redis at all.
    //
    // `version` is embedded in the payload as well as held in cl:ver, so the
    // whole read model is genuinely one self-contained blob.
    await redis.mset({
      [SNAPSHOT_KEY]: JSON.stringify({ ...payload, version, refreshCount: claim.refreshCount + 1 }),
      [VERSION_KEY]: String(version),
    });
    await redis.expire(SNAPSHOT_KEY, TTL_SECONDS);
    await redis.expire(VERSION_KEY, TTL_SECONDS);

    await ctx.runMutation(internal.snapshot.completeRefresh, {
      sha,
      count: payload.papers.length,
      changed: true,
      version,
    });

    return {
      status: "written",
      version,
      count: payload.papers.length,
      sha,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await ctx.runMutation(internal.snapshot.failRefresh, { error: message });
    // Deliberately rethrown: a failed daily repair must show up in the
    // Convex function logs rather than passing silently.
    throw err;
  }
}

const refreshResultValidator = v.object({
  status: v.union(
    v.literal("written"),
    v.literal("unchanged"),
    v.literal("debounced"),
    v.literal("skipped-no-config"),
    v.literal("error"),
  ),
  version: v.number(),
  count: v.number(),
  sha: v.union(v.string(), v.null()),
  error: v.union(v.string(), v.null()),
});

/**
 * Debounced rebuild. Enqueued with `ctx.scheduler.runAfter(0, …)` from inside
 * every catalogue-mutating mutation so the rebuild is committed atomically with
 * the write that invalidated it — a separate cron could miss the change, and a
 * fire-and-forget call from the client could be dropped.
 */
export const refresh = internalAction({
  args: { force: v.optional(v.boolean()) },
  returns: refreshResultValidator,
  handler: async (ctx, args) => {
    const result = await doRefresh(ctx, {
      force: args.force ?? false,
      minIntervalMs: REFRESH_DEBOUNCE_MS,
    });
    return { ...result, error: null };
  },
});

/**
 * Daily repair job. Bypasses the debounce, rebuilds from Convex, and repairs
 * Redis if the content hash drifted. This is the safety net that lets Redis be
 * treated as disposable — and the daily write is what keeps Upstash from
 * archiving the database.
 */
export const verify = internalAction({
  args: {},
  returns: refreshResultValidator,
  handler: async (ctx) => {
    const result = await doRefresh(ctx, { force: true, minIntervalMs: 0 });
    return { ...result, error: null };
  },
});

/** Introspection for the dashboard — not used by the web app. */
export const status = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      lastAttemptAt: v.union(v.number(), v.null()),
      lastRefreshAt: v.union(v.number(), v.null()),
      lastVerifiedAt: v.union(v.number(), v.null()),
      version: v.number(),
      refreshCount: v.number(),
      count: v.number(),
      sha: v.union(v.string(), v.null()),
      lastError: v.union(v.string(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const meta = await ctx.db.query("snapshotMeta").first();
    if (!meta) return null;
    return {
      lastAttemptAt: meta.lastAttemptAt ?? null,
      lastRefreshAt: meta.lastRefreshAt ?? null,
      lastVerifiedAt: meta.lastVerifiedAt ?? null,
      version: meta.version ?? 0,
      refreshCount: meta.refreshCount ?? 0,
      count: meta.count ?? 0,
      sha: meta.sha ?? null,
      lastError: meta.lastError ?? null,
    };
  },
});
