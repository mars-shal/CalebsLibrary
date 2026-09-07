// Caleb's Library — per-paper metric counters (Convex).
//
// Replaces the old Supabase `metrics` table + `bump_metric` RPC. The store
// reads the whole table via `getAll` and overlays it onto the catalogue; UI
// actions (views, downloads, votes) call `bump` with an explicit delta (±1),
// keeping the bump stateless and idempotence-friendly.
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

// Every metric row — the store overlays these on the catalogue items.
export const getAll = zCustomQuery(query, NoOp)({
  args: {},
  returns: metricSchema.array(),
  handler: async (ctx) => {
    return await ctx.db.query("metrics").collect();
  },
});

// Add `delta` (usually ±1) to one counter for a paper, never going negative.
export const bump = zCustomMutation(mutation, NoOp)({
  args: {
    paper_id: z.string(),
    kind: z.enum(["reads", "downloads", "upvotes", "downvotes"]),
    delta: z.number().int(),
  },
  returns: z.object({ ok: z.boolean() }),
  handler: async (ctx, { paper_id, kind, delta }) => {
    const existing = await ctx.db
      .query("metrics")
      .withIndex("by_paper_id", (q) => q.eq("paper_id", paper_id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        [kind]: Math.max(0, existing[kind] + delta),
      });
    } else {
      await ctx.db.insert("metrics", {
        paper_id,
        reads: kind === "reads" ? Math.max(0, delta) : 0,
        downloads: kind === "downloads" ? Math.max(0, delta) : 0,
        upvotes: kind === "upvotes" ? Math.max(0, delta) : 0,
        downvotes: kind === "downvotes" ? Math.max(0, delta) : 0,
      });
    }
    return { ok: true };
  },
});