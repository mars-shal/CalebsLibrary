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
    .index("by_created", ["createdAt"])
    // Added for `catalogue.facets`: scoping by program alone. The existing
    // by_level_program_type index is prefixed by levelYear, so "all levels,
    // one program" had no usable range and fell back to scanning by_created
    // and filtering in JS — a full table read for every filter change.
    //
    // Deliberately NOT `staged: true`. Staged indexes cannot be queried until
    // the flag is removed, which would ship `facets` pointing at an index that
    // cannot resolve. Staging only pays off for tables large enough that the
    // backfill blocks a push, which a course library is not.
    .index("by_program", ["program"]),

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
    .index("by_device", ["deviceHash"])
    // Added for the duplicate check in `submissions.create`: status + course
    // narrows the scan to the one course being submitted instead of collecting
    // every pending submission in the app. Not staged, for the same reason as
    // catalogue.by_program.
    .index("by_status_course", ["status", "course"]),

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

  // Singleton fingerprint of the Google Drive tree that produced the current
  // catalogue. `catalogue.syncDiffFromDrive` compares the freshly-walked tree
  // against this and returns early when they match, so an unchanged Drive costs
  // one walk and zero database work. At most one document ever exists here.
  driveSyncState: defineTable({
    hash: v.string(),
    count: v.number(),
    appliedAt: v.number(),
  }),

  // Singleton bookkeeping for the Upstash read snapshot (convex/snapshot.ts).
  // At most one document ever exists here; it is claimed via OCC so concurrent
  // refresh triggers cannot both write, and it records the last content hash so
  // the daily verify job can detect drift.
  snapshotMeta: defineTable({
    lastAttemptAt: v.optional(v.number()),
    lastRefreshAt: v.optional(v.number()),
    lastVerifiedAt: v.optional(v.number()),
    version: v.optional(v.number()),
    refreshCount: v.optional(v.number()),
    count: v.optional(v.number()),
    sha: v.optional(v.string()),
    lastError: v.optional(v.string()),
  }),

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
