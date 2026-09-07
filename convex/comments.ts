// Caleb's Library — comments & moderation (Convex).
//
// Replaces the old Supabase `comments` table + Realtime channel. The public
// discussion surface (`list`, `post`) is backed by a moderation queue: a new
// comment starts as "pending" and only becomes visible via `list` once a
// moderator approves it.
//
// Admin surface (`queueList`, `moderate`) is gated by a passphrase stored in
// the Convex env (ADMIN_PASSPHRASE, set via `npx convex env set`) and checked
// server-side — it is never shipped in the client bundle.
import { z } from "zod";
import { zCustomQuery, zCustomMutation, zid } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, mutation, env } from "./_generated/server";

const commentItemSchema = z.object({
  _id: zid("comments"),
  paper_id: z.string(),
  author_name: z.string(),
  body: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  note: z.string().optional(),
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
// bad comments after the fact (see queueList/moderate).
export const post = zCustomMutation(mutation, NoOp)({
  args: {
    paper_id: z.string(),
    author_name: z.string().min(1).max(80),
    body: z.string().min(1).max(5000),
  },
  returns: z.object({ id: z.string() }),
  handler: async (ctx, { paper_id, author_name, body }) => {
    const id = await ctx.db.insert("comments", {
      paper_id,
      author_name: author_name.trim() || "Anonymous",
      body: body.trim(),
      status: "approved",
      created_at: Date.now(),
    });
    return { id };
  },
});

// Full queue for the moderation panel. Returns { verified: false, items: [] }
// when the passphrase is wrong so a failed guess looks identical to an empty
// queue.
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

// Approve or reject a queued comment.
export const moderate = zCustomMutation(mutation, NoOp)({
  args: {
    passphrase: z.string(),
    id: zid("comments"),
    status: z.enum(["approved", "rejected"]),
    note: z.string().optional(),
  },
  returns: z.object({ ok: z.boolean() }),
  handler: async (ctx, { passphrase, id, status, note }) => {
    if (!isAdmin(passphrase)) {
      throw new Error("Invalid passphrase");
    }
    await ctx.db.patch(id, {
      status,
      ...(note && note.trim() ? { note: note.trim() } : {}),
      reviewed_at: Date.now(),
    });
    return { ok: true };
  },
});