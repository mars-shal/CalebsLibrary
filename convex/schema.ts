// Caleb's Library — Convex database schema.
//
// The `catalogue` table stores the synced Drive tree. The field shape is
// derived from the shared Zod schema (src/schema/catalogue.ts) so the backend
// and the frontend always agree on the item shape.
//
// `comments` holds the discussion for each paper. New comments are posted
// with status "approved" so discussion is visible immediately; moderators can
// still reject them later (see convex/comments.ts).
//
// `metrics` holds per-paper counters (reads, downloads, upvotes, downvotes).
// It replaces the old Supabase `metrics` table + `bump_metric` RPC.
//
// `searchTrends` aggregates search terms site-wide. `record` bumps a term's
// count and timestamp; `getTop` applies recency decay so old terms fade and
// the home "Or browse:" row reflects what's trending now (see convex/trends.ts).
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { zodToConvexFields } from "convex-helpers/server/zod4";
import { catalogueItemSchema } from "../src/schema/catalogue";

export default defineSchema({
  catalogue: defineTable(
    zodToConvexFields(catalogueItemSchema.shape),
  ).index("by_drive_id", ["id"]),

  comments: defineTable({
    paper_id: v.string(),
    author_name: v.string(),
    body: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    note: v.optional(v.string()),
    created_at: v.number(),
    reviewed_at: v.optional(v.number()),
  }).index("by_paper", ["paper_id"]),

  metrics: defineTable({
    paper_id: v.string(),
    reads: v.number(),
    downloads: v.number(),
    upvotes: v.number(),
    downvotes: v.number(),
  }).index("by_paper_id", ["paper_id"]),

  shortLinks: defineTable({
    code: v.string(),
    paper_id: v.string(),
    url: v.string(),
    created_at: v.number(),
    clicks: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_paper_id", ["paper_id"]),

  searchTrends: defineTable({
    term: v.string(),
    count: v.number(),
    updated_at: v.number(),
  }).index("by_term", ["term"]),
});