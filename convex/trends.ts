// Caleb's Library — site-wide search term trends (Convex).
//
// Replaces the localStorage-only search history in src/script/trends.ts.
// Every committed search calls `record`, which aggregates the term across all
// visitors. `getTop` applies recency decay (30-day half-life) so the home
// "Or browse:" row reflects what students are searching right now — exam
// season spikes rise and fade instead of accumulating forever.
import { z } from "zod";
import { zCustomQuery, zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, mutation, internalMutation } from "./_generated/server";

const HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;

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

// Sweep out terms whose score has decayed to zero so the table can't grow
// without bound. Scheduled by the cron (convex/crons.ts).
export const pruneStale = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db.query("searchTrends").collect();
    for (const row of rows) {
      if (decayedScore(row.count, row.updated_at, now) <= 0) {
        await ctx.db.delete(row._id);
      }
    }
  },
});