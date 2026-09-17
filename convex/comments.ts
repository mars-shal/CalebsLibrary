// Caleb's Library — comments & moderation (Convex).
//
// v2: `post` is documented post-moderation (inserts "approved", shows
// immediately) with a 60s identical-body duplicate guard. Added `queuePage`
// (paginated moderation queue for mobile — legacy `queueList` full-collect
// stays for web compat). `moderate` writes the `decisions` audit log.
//
// Admin surface (`queueList`, `queuePage`, `moderate`) is gated by a
// passphrase stored in the Convex env (ADMIN_PASSPHRASE, set via
// `npx convex env set`) and checked server-side — never shipped to clients.
import { z } from "zod";
import { zCustomQuery, zCustomMutation, zid } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, mutation, env } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

const commentItemSchema = z.object({
  _id: zid("comments"),
  paper_id: z.string(),
  author_name: z.string(),
  body: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  note: z.string().optional(),
  parentId: z.string().optional(),
  pinned: z.boolean().optional(),
  created_at: z.number(),
  reviewed_at: z.number().optional(),
});

const queueSchema = z.object({
  verified: z.boolean(),
  items: commentItemSchema.array(),
});

function isAdmin(passphrase: string): boolean {
  return !!env.ADMIN_PASSPHRASE && env.ADMIN_PASSPHRASE === passphrase;
}

// Approved comments for a paper, oldest first. Callers can subscribe to this
// via the Convex client to get live updates.
export const list = zCustomQuery(query, NoOp)({
  args: { paper_id: z.string() },
  returns: commentItemSchema.array(),
  handler: async (ctx, { paper_id }) => {
    const all = await ctx.db
      .query("comments")
      .withIndex("by_paper", (q) => q.eq("paper_id", paper_id))
      .collect();
    return all
      .filter((c) => c.status === "approved")
      .sort((a, b) => a.created_at - b.created_at);
  },
});

// Add a comment to the discussion. Inserted as "approved" so it shows up
// immediately — the moderation queue stays available for admins to clean up
// bad comments after the fact (see queueList/queuePage/moderate).
// Rejects byte-identical reposts to the same paper within 60s (double-tap
// and retry storms). Mobile additionally rate-limits (1 per 10s) client-side.
export const post = zCustomMutation(mutation, NoOp)({
  args: {
    paper_id: z.string(),
    author_name: z.string().min(1).max(80),
    body: z.string().min(1).max(5000),
    parentId: z.string().optional(),
  },
  returns: z.object({ id: z.string() }),
  handler: async (ctx, { paper_id, author_name, body, parentId }) => {
    const text = body.trim();
    if (!text) throw new Error("Comment body required.");
    const recent = await ctx.db
      .query("comments")
      .withIndex("by_paper", (q) => q.eq("paper_id", paper_id))
      .collect();
    const now = Date.now();
    if (recent.some((c) => c.body === text && now - c.created_at < 60_000)) {
      throw new Error("Duplicate comment — please wait a minute.");
    }
    // Replies attach to top-level comments on the same paper only.
    if (parentId) {
      const parent = recent.find((c) => String(c._id) === parentId);
      if (!parent) throw new Error("Original comment not found.");
      if (parent.parentId) throw new Error("Replies nest one level only.");
    }
    const id = await ctx.db.insert("comments", {
      paper_id,
      author_name: author_name.trim() || "Anonymous",
      body: text,
      status: "approved",
      parentId,
      created_at: now,
    });
    return { id: String(id) };
  },
});

// LEGACY full queue for the web moderation panel. Returns
// `{ verified: false, items: [] }` when the passphrase is wrong so a failed
// guess looks identical to an empty queue. Mobile uses `queuePage`.
export const queueList = zCustomQuery(query, NoOp)({
  args: { passphrase: z.string() },
  returns: queueSchema,
  handler: async (ctx, { passphrase }) => {
    if (!isAdmin(passphrase)) return { verified: false, items: [] };
    const all = await ctx.db.query("comments").collect();
    return {
      verified: true,
      items: all.sort((a, b) => b.created_at - a.created_at),
    };
  },
});

// Paginated queue for mobile moderation. Same verified:false contract.
export const queuePage = query({
  args: {
    passphrase: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    if (!isAdmin(a.passphrase)) {
      return { verified: false as const, page: [], isDone: true, continueCursor: "" };
    }
    const res = await ctx.db.query("comments").order("desc").paginate(a.paginationOpts);
    return { verified: true as const, ...res };
  },
});

// Approve or reject a queued comment (writes the decisions audit log).
// `pinned: true` marks the single moderator-endorsed answer per paper
// (all others for that paper are unpinned automatically).
export const moderate = zCustomMutation(mutation, NoOp)({
  args: {
    passphrase: z.string(),
    id: zid("comments"),
    status: z.enum(["approved", "rejected"]),
    note: z.string().optional(),
    deviceHash: z.string().optional(),
    pinned: z.boolean().optional(),
  },
  returns: z.object({ ok: z.boolean() }),
  handler: async (ctx, { passphrase, id, status, note, deviceHash, pinned }) => {
    if (!isAdmin(passphrase)) {
      throw new Error("Invalid passphrase");
    }
    const target = await ctx.db.get(id);
    if (!target) throw new Error("Comment not found.");
    const trimmed = note?.trim() || undefined;
    if (pinned === true) {
      const siblings = await ctx.db
        .query("comments")
        .withIndex("by_paper", (q) => q.eq("paper_id", target.paper_id))
        .collect();
      await Promise.all(
        siblings
          .filter((s) => s.pinned && String(s._id) !== String(id))
          .map((s) => ctx.db.patch(s._id, { pinned: false })),
      );
    }
    await ctx.db.patch(id, {
      status,
      ...(trimmed ? { note: trimmed } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
      reviewed_at: Date.now(),
    });
    await ctx.db.insert("decisions", {
      targetType: "comment",
      targetId: String(id),
      action: pinned === true ? "pinned" : status,
      ...(trimmed ? { note: trimmed } : {}),
      deviceHash,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});
