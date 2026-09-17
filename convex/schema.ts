// Caleb's Library — Convex database schema.
//
// v2: catalogue carries college/program/level routing (the old Drive walk
// dropped the Path — see driveSync.buildPaper) plus license + file identity.
// New tables: submissions (upload pipeline), reports (takedown flags),
// votes (device-deduped, replaces blind localStorage), decisions (moderation
// audit log). `parents` is retained for web compat but mobile projections
// must exclude it (dead weight, never rendered).
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { zodToConvexFields } from "convex-helpers/server/zod4";
import { catalogueItemSchema } from "../src/schema/catalogue";

const modStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);

export default defineSchema({
  catalogue: defineTable(
    zodToConvexFields(catalogueItemSchema.shape),
  )
    .index("by_drive_id", ["id"])
    .index("by_level_program_type", ["levelYear", "program", "type"])
    .index("by_course_type_year", ["course", "type", "year"])
    .index("by_created", ["createdAt"]),

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
    parentId: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
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

  submissions: defineTable({
    title: v.string(),
    subject: v.string(),
    subjectName: v.string(),
    course: v.string(),
    courseName: v.string(),
    teacher: v.optional(v.string()),
    type: v.string(),
    year: v.number(),
    license: v.string(),
    contributorName: v.string(),
    contributorEmail: v.optional(v.string()),
    college: v.string(),
    program: v.string(),
    level: v.string(),
    semester: v.optional(v.string()),
    fileExt: v.string(),
    sizeBytes: v.number(),
    storageId: v.optional(v.id("_storage")),
    deviceHash: v.optional(v.string()),
    status: modStatus,
    note: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_device", ["deviceHash"]),

  reports: defineTable({
    paperId: v.string(),
    reason: v.union(
      v.literal("wrong-file"),
      v.literal("copyright"),
      v.literal("spam"),
      v.literal("other"),
    ),
    details: v.optional(v.string()),
    deviceHash: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed"),
    ),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_paper", ["paperId"]),

  votes: defineTable({
    paperId: v.string(),
    deviceHash: v.string(),
    value: v.number(),
    voterProgram: v.optional(v.string()),
    voterLevel: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_paper_device", ["paperId", "deviceHash"])
    .index("by_paper", ["paperId"]),

  decisions: defineTable({
    targetType: v.string(),
    targetId: v.string(),
    action: v.string(),
    note: v.optional(v.string()),
    deviceHash: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_target", ["targetType", "targetId"]),

  users: defineTable({
    email: v.string(),
    name: v.string(),
    program: v.string(),
    level: v.string(),
    college: v.optional(v.string()),
    deviceHash: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_device", ["deviceHash"]),
});
