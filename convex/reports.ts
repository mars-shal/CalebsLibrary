// Caleb's Library — paper reports / takedown flags (Convex).
//
// Replaces the dead web "Report an issue" button. Anyone can file a report;
// moderators triage via `list`/`decide`. A paper with 3+ pending reports from
// distinct devices is auto-flagged (mobile hides it pending review).
import { query, mutation, env } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

const reasonValidator = v.union(
  v.literal("wrong-file"),
  v.literal("copyright"),
  v.literal("spam"),
  v.literal("other"),
);

const FLAG_THRESHOLD = 3;

function isMod(passphrase: string): boolean {
  return !!env.ADMIN_PASSPHRASE && env.ADMIN_PASSPHRASE === passphrase;
}

// File a report against a paper.
export const create = mutation({
  args: {
    paperId: v.string(),
    reason: reasonValidator,
    details: v.optional(v.string()),
    deviceHash: v.optional(v.string()),
  },
  returns: v.object({ id: v.id("reports"), pendingCount: v.number() }),
  handler: async (ctx, a) => {
    const details = a.details?.trim().slice(0, 1000) || undefined;
    // One pending report per device per paper — repeat taps update nothing.
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_paper", (q) => q.eq("paperId", a.paperId))
      .collect();
    const dup = existing.find(
      (r) =>
        r.status === "pending" &&
        a.deviceHash &&
        r.deviceHash === a.deviceHash &&
        r.reason === a.reason,
    );
    if (dup) {
      const distinct = new Set(
        existing
          .filter((r) => r.status === "pending" && r.deviceHash)
          .map((r) => r.deviceHash),
      ).size;
      return { id: dup._id, pendingCount: distinct };
    }
    const id = await ctx.db.insert("reports", {
      paperId: a.paperId,
      reason: a.reason,
      details,
      deviceHash: a.deviceHash,
      status: "pending",
      createdAt: Date.now(),
    });
    const after = await ctx.db
      .query("reports")
      .withIndex("by_paper", (q) => q.eq("paperId", a.paperId))
      .collect();
    const distinct = new Set(
      after
        .filter((r) => r.status === "pending" && r.deviceHash)
        .map((r) => r.deviceHash),
    ).size;
    return { id, pendingCount: distinct };
  },
});

// Moderation queue for reports (paginated).
export const list = query({
  args: {
    passphrase: v.string(),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    if (!isMod(a.passphrase)) {
      return { verified: false as const, page: [], isDone: true, continueCursor: "" };
    }
    const base = a.status
      ? ctx.db.query("reports").withIndex("by_status", (q) => q.eq("status", a.status!))
      : ctx.db.query("reports");
    const res = await base.order("desc").paginate(a.paginationOpts);
    return { verified: true as const, ...res };
  },
});

// Resolve a report. `reviewed` = action taken, `dismissed` = no action.
export const decide = mutation({
  args: {
    passphrase: v.string(),
    id: v.id("reports"),
    status: v.union(v.literal("reviewed"), v.literal("dismissed")),
    note: v.optional(v.string()),
    deviceHash: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, a) => {
    if (!isMod(a.passphrase)) throw new Error("Invalid passphrase");
    const r = await ctx.db.get(a.id);
    if (!r) throw new Error("Report not found.");
    if (r.status !== "pending") throw new Error("Already decided.");
    const note = a.note?.trim() || undefined;
    await ctx.db.patch(a.id, { status: a.status });
    await ctx.db.insert("decisions", {
      targetType: "report",
      targetId: String(a.id),
      action: a.status,
      ...(note ? { note } : {}),
      deviceHash: a.deviceHash,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const FLAG_THRESHOLD_VALUE = FLAG_THRESHOLD;
