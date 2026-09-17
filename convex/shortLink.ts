// Caleb's Library — in-house short share links (Convex).
//
// v2: `create` VALIDATES the destination (scheme + host allowlist + length).
// The old mutation stored any caller-supplied URL and the resolver redirected
// blindly — an open-redirect/phishing vector on a PUBLIC mutation. Creation
// is also globally throttled (5 newest links inside 60s → reject).
// Codes remain deterministic per paper (FNV-1a → base62) so re-sharing the
// same paper reuses its link instead of minting new ones.
import { z } from "zod";
import { zCustomQuery, zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, mutation } from "./_generated/server";

const CODE_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_LENGTH = 7;
const MAX_URL_LENGTH = 2048;
const CREATE_WINDOW_MS = 60_000;
const CREATE_WINDOW_COUNT = 5;

// Hosts we will ever redirect to. `calebs:` covers app deep links;
// localhost entries cover dev; update when the web origin is finalized.
const ALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
  "calebslibrary.org",
]);
function hostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  if (ALLOWED_HOSTS.has(h)) return true;
  if (h.endsWith(".calebslibrary.org")) return true;
  if (h.endsWith(".vercel.app")) return true;
  if (h.endsWith(".convex.site")) return true;
  if (h.endsWith(".convex.cloud")) return true;
  return false;
}

function assertShareableUrl(url: string): void {
  if (!url || url.length > MAX_URL_LENGTH) throw new Error("Invalid share URL.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid share URL.");
  }
  if (!["https:", "http:", "calebs:"].includes(parsed.protocol)) {
    throw new Error("URL scheme not allowed.");
  }
  if (parsed.protocol !== "calebs:" && !hostAllowed(parsed.hostname)) {
    throw new Error("URL host not allowed.");
  }
}

// FNV-1a hash of the seed → fixed-length base62 string. Deterministic per
// paper id, so re-sharing the same paper yields the same short code.
function codeFromSeed(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  let value = hash >>> 0;
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[value % CODE_CHARS.length];
    value = Math.floor(value / CODE_CHARS.length);
  }
  return code;
}

// Resolve a short code to its destination URL (used by the /s/:code page).
export const getByCode = zCustomQuery(query, NoOp)({
  args: { code: z.string() },
  returns: z.object({ url: z.string(), paper_id: z.string() }).nullable(),
  handler: async (ctx, { code }) => {
    const link = await ctx.db
      .query("shortLinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    return link ? { url: link.url, paper_id: link.paper_id } : null;
  },
});

// Create (or reuse) a short link for a paper. Idempotent per paper_id.
export const create = zCustomMutation(mutation, NoOp)({
  args: { paper_id: z.string(), url: z.string() },
  returns: z.object({ code: z.string() }),
  handler: async (ctx, { paper_id, url }) => {
    assertShareableUrl(url);
    const existing = await ctx.db
      .query("shortLinks")
      .withIndex("by_paper_id", (q) => q.eq("paper_id", paper_id))
      .first();
    if (existing) return { code: existing.code };

    const latest = await ctx.db.query("shortLinks").order("desc").take(CREATE_WINDOW_COUNT);
    if (
      latest.length === CREATE_WINDOW_COUNT &&
      Date.now() - latest[CREATE_WINDOW_COUNT - 1]!.created_at < CREATE_WINDOW_MS
    ) {
      throw new Error("Slow down — try again in a minute.");
    }

    let code = codeFromSeed(paper_id);
    let attempt = 0;
    while (
      await ctx.db
        .query("shortLinks")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first()
    ) {
      // Astronomically rare hash clash — re-seed and retry a few times.
      code = codeFromSeed(`${paper_id}:${attempt}`);
      attempt++;
      if (attempt > 8) throw new Error("Could not mint a unique short code");
    }
    await ctx.db.insert("shortLinks", {
      code,
      paper_id,
      url,
      created_at: Date.now(),
      clicks: 0,
    });
    return { code };
  },
});

// Count a redirect hit (fire-and-forget from the /s/:code page).
export const bumpClicks = zCustomMutation(mutation, NoOp)({
  args: { code: z.string() },
  returns: z.object({ ok: z.boolean() }),
  handler: async (ctx, { code }) => {
    const link = await ctx.db
      .query("shortLinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (link) await ctx.db.patch(link._id, { clicks: link.clicks + 1 });
    return { ok: true };
  },
});
