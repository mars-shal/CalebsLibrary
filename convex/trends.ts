// Caleb's Library — site-wide search term trends (Convex).
//
// v2: `record` throttles (one write per term per 5s — the old path wrote on
// every commit without bound); `pruneStale` actually deletes now (the old
// `<= 0` threshold could never fire since decay only approaches zero —
// threshold is score < 0.01 or age > 180 days).
import { z } from "zod";
import { zCustomQuery, zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, mutation, internalMutation } from "./_generated/server";

const HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;
const STALE_SCORE = 0.01;
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const RECORD_COOLDOWN_MS = 5_000;

function decayedScore(count: number, updatedAt: number, now: number): number {
  return count * Math.pow(0.5, Math.max(0, now - updatedAt) / HALF_LIFE_MS);
}

const trendSchema = z.object({
  term: z.string(),
  score: z.number(),
});

// Read the current top search terms, weighted by recency.
export const getTop = zCustomQuery(query, NoOp)({
  args: { limit: z.number().int().min(1).max(100).default(50) },
  returns: trendSchema.array(),
  handler: async (ctx, { limit }) => {
    const now = Date.now();
    const rows = await ctx.db.query("searchTrends").collect();
    return rows
      .map((row) => ({ term: row.term, score: decayedScore(row.count, row.updated_at, now) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter((t) => t.score > 0);
  },
});

// Record one committed search. Idempotent by normalized term — repeats
// accumulate count and refresh `updated_at`, reanimating the term's score.
// Writes at most once per term per 5s (commit + retry storms).
export const record = zCustomMutation(mutation, NoOp)({
  args: { term: z.string() },
  returns: z.object({ ok: z.boolean() }),
  handler: async (ctx, { term }) => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return { ok: false };
    const existing = await ctx.db
      .query("searchTrends")
      .withIndex("by_term", (q) => q.eq("term", normalized))
      .first();
    if (existing) {
      if (Date.now() - existing.updated_at < RECORD_COOLDOWN_MS) {
        return { ok: true };
      }
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
        updated_at: Date.now(),
      });
    } else {
      await ctx.db.insert("searchTrends", {
        term: normalized,
        count: 1,
        updated_at: Date.now(),
      });
    }
    return { ok: true };
  },
});

// Sweep out terms whose score has decayed below usefulness (or that are over
// 180 days old) so the table can't grow without bound. Scheduled by the cron
// (convex/crons.ts).
export const pruneStale = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db.query("searchTrends").collect();
    for (const row of rows) {
      if (
        decayedScore(row.count, row.updated_at, now) < STALE_SCORE ||
        now - row.updated_at > MAX_AGE_MS
      ) {
        await ctx.db.delete(row._id);
      }
    }
  },
});
