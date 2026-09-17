// Caleb's Library — per-paper metric counters (Convex).
//
// v2: added `getByIds` so mobile hydrates only visible cards (the legacy
// `getAll` full-collect stays for web compat — mobile must NOT call it).
// `bump` deltas are CLAMPED to ±1: the old signature accepted arbitrary ints,
// letting any client inflate/deflate counters without bound.
import { z } from "zod";
import { zCustomQuery, zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, mutation } from "./_generated/server";

const metricSchema = z.object({
  paper_id: z.string(),
  reads: z.number(),
  downloads: z.number(),
  upvotes: z.number(),
  downvotes: z.number(),
});

// Metric rows for exactly the papers on screen (max 100 per call).
export const getByIds = zCustomQuery(query, NoOp)({
  args: { ids: z.array(z.string()).max(100) },
  returns: metricSchema.array(),
  handler: async (ctx, { ids }) => {
    const rows = await Promise.all(
      ids.slice(0, 100).map((id) =>
        ctx.db
          .query("metrics")
          .withIndex("by_paper_id", (q) => q.eq("paper_id", id))
          .first(),
      ),
    );
    return rows.flatMap((r) => (r ? [r] : []));
  },
});

// LEGACY — every metric row (web overlay). Mobile uses `getByIds`.
export const getAll = zCustomQuery(query, NoOp)({
  args: {},
  returns: metricSchema.array(),
  handler: async (ctx) => {
    return await ctx.db.query("metrics").collect();
  },
});

function clampDelta(delta: number): number {
  if (delta === 0) return 0;
  return delta > 0 ? 1 : -1;
}

// Add a clamped `delta` (±1) to one counter for a paper, never negative.
// Mobile additionally throttles (5s per paper/kind) and queues offline.
export const bump = zCustomMutation(mutation, NoOp)({
  args: {
    paper_id: z.string(),
    kind: z.enum(["reads", "downloads", "upvotes", "downvotes"]),
    delta: z.number().int(),
  },
  returns: z.object({ ok: z.boolean() }),
  handler: async (ctx, { paper_id, kind, delta }) => {
    const d = clampDelta(delta);
    if (d === 0) return { ok: true };
    const existing = await ctx.db
      .query("metrics")
      .withIndex("by_paper_id", (q) => q.eq("paper_id", paper_id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        [kind]: Math.max(0, existing[kind] + d),
      });
    } else {
      await ctx.db.insert("metrics", {
        paper_id,
        reads: kind === "reads" ? 1 : 0,
        downloads: kind === "downloads" ? 1 : 0,
        upvotes: kind === "upvotes" ? 1 : 0,
        downvotes: kind === "downvotes" ? 1 : 0,
      });
    }
    return { ok: true };
  },
});
