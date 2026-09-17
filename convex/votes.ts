// Caleb's Library — device-deduped votes (Convex).
//
// Replaces blind localStorage-only voting: each device gets one vote value
// (-1 | 0 | 1) per paper, stored server-side, with the metrics counters
// moved by the exact delta. localStorage remains as an optimistic mirror.
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function clampDelta(delta: number): number {
  if (delta === 0) return 0;
  return delta > 0 ? 1 : -1;
}

async function applyMetric(
  ctx: any,
  paperId: string,
  kind: "upvotes" | "downvotes",
  delta: number,
): Promise<void> {
  const d = clampDelta(delta);
  if (d === 0) return;
  const existing = await ctx.db
    .query("metrics")
    .withIndex("by_paper_id", (q: any) => q.eq("paper_id", paperId))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, {
      [kind]: Math.max(0, existing[kind] + d),
    });
  } else {
    await ctx.db.insert("metrics", {
      paper_id: paperId,
      reads: 0,
      downloads: 0,
      upvotes: kind === "upvotes" ? 1 : 0,
      downvotes: kind === "downvotes" ? 1 : 0,
    });
  }
}

// Set this device's vote. Toggling 1 -> 1 clears to 0 (client mirrors web
// toggle semantics; server stores the final value). Voter scope rides along
// so clients can weight in-scope votes (anti-stuffing: same-program signal).
export const toggle = mutation({
  args: {
    paperId: v.string(),
    deviceHash: v.string(),
    value: v.number(),
    voterProgram: v.optional(v.string()),
    voterLevel: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean(), value: v.number() }),
  handler: async (ctx, a) => {
    if (![-1, 0, 1].includes(a.value)) throw new Error("Invalid vote value.");
    if (!a.deviceHash) throw new Error("Device identity required.");
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_paper_device", (q) =>
        q.eq("paperId", a.paperId).eq("deviceHash", a.deviceHash),
      )
      .first();
    const prev = existing?.value ?? 0;
    if (prev === a.value) {
      if (existing && (a.voterProgram || a.voterLevel)) {
        await ctx.db.patch(existing._id, {
          voterProgram: a.voterProgram,
          voterLevel: a.voterLevel,
          updatedAt: Date.now(),
        });
      }
      return { ok: true, value: prev };
    }

    if (prev === 1) await applyMetric(ctx, a.paperId, "upvotes", -1);
    if (prev === -1) await applyMetric(ctx, a.paperId, "downvotes", -1);
    if (a.value === 1) await applyMetric(ctx, a.paperId, "upvotes", 1);
    if (a.value === -1) await applyMetric(ctx, a.paperId, "downvotes", 1);

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: a.value,
        voterProgram: a.voterProgram,
        voterLevel: a.voterLevel,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("votes", {
        paperId: a.paperId,
        deviceHash: a.deviceHash,
        value: a.value,
        voterProgram: a.voterProgram,
        voterLevel: a.voterLevel,
        updatedAt: Date.now(),
      });
    }
    return { ok: true, value: a.value };
  },
});

// All votes for a paper (bounded by voter count — small). Clients derive
// in-scope counts locally; totals stay on metrics.
export const byPaper = query({
  args: { paperId: v.string() },
  returns: v.array(
    v.object({
      value: v.number(),
      voterProgram: v.optional(v.string()),
      voterLevel: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, a) => {
    const rows = await ctx.db
      .query("votes")
      .withIndex("by_paper", (q) => q.eq("paperId", a.paperId))
      .collect();
    return rows.map((r) => ({
      value: r.value,
      voterProgram: r.voterProgram,
      voterLevel: r.voterLevel,
    }));
  },
});
