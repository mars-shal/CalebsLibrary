// Caleb's Library — community submissions (Convex).
//
// New mobile upload pipeline (the web UploadView is a paused placeholder).
// Flow: client picks a file -> uploads bytes to Convex storage -> calls
// `create` with metadata -> row sits `pending` -> a moderator approves
// (inserts a catalogue row with REAL zeroed metrics — never hash fakes)
// or rejects (reviewer note returned to the submitter).
// Contributor email stays private (moderation contact only, never rendered).
import { query, mutation, env } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  hashString,
  estimatePages,
  formatBytes,
  levelYearOf,
  DEFAULT_LICENSE,
} from "../src/schema/catalogue";

const modStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);

function isMod(passphrase: string): boolean {
  return !!env.ADMIN_PASSPHRASE && env.ADMIN_PASSPHRASE === passphrase;
}

const FILE_EXTS = ["pdf", "docx", "pptx", "png", "jpg", "jpeg", "webp", "txt"];
const MAX_BYTES = 50 * 1024 * 1024;

// Submit a paper for moderation. Throws on exact duplicates
// (same title + course already live or pending).
export const create = mutation({
  args: {
    title: v.string(),
    subject: v.string(),
    subjectName: v.string(),
    course: v.string(),
    courseName: v.string(),
    teacher: v.optional(v.string()),
    type: v.string(),
    year: v.number(),
    license: v.optional(v.string()),
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
  },
  returns: v.object({ id: v.id("submissions") }),
  handler: async (ctx, a) => {
    const title = a.title.trim();
    if (!title || title.length > 200)
      throw new Error("Title must be 1–200 characters.");
    if (!FILE_EXTS.includes(a.fileExt.toLowerCase()))
      throw new Error("Unsupported file type.");
    if (a.sizeBytes < 0 || a.sizeBytes > MAX_BYTES)
      throw new Error("File must be 50MB or smaller.");
    if (!Number.isInteger(a.year) || a.year < 2000 || a.year > 2100)
      throw new Error("Invalid year.");
    const name = a.contributorName.trim().slice(0, 80) || "Anonymous";

    const normTitle = title.toLowerCase();
    const normCourse = a.course.trim().toLowerCase();
    // Live duplicates: same title + course already on the shelves.
    const live = await ctx.db
      .query("catalogue")
      .withIndex("by_course_type_year", (q) =>
        q.eq("course", a.course).eq("type", a.type).eq("year", a.year),
      )
      .collect();
    if (live.some((p) => p.title.toLowerCase() === normTitle))
      throw new Error("This paper looks like a duplicate of one already live.");
    // Pending duplicates: same title + course awaiting review.
    const pending = await ctx.db
      .query("submissions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    if (
      pending.some(
        (s) =>
          s.title.toLowerCase() === normTitle &&
          s.course.trim().toLowerCase() === normCourse,
      )
    )
      throw new Error("This paper is already awaiting review.");

    const id = await ctx.db.insert("submissions", {
      title,
      subject: a.subject,
      subjectName: a.subjectName,
      course: a.course,
      courseName: a.courseName,
      teacher: a.teacher?.trim() || undefined,
      type: a.type,
      year: a.year,
      license: a.license || DEFAULT_LICENSE,
      contributorName: name,
      contributorEmail: a.contributorEmail?.trim() || undefined,
      college: a.college,
      program: a.program,
      level: a.level,
      semester: a.semester || undefined,
      fileExt: a.fileExt.toLowerCase(),
      sizeBytes: a.sizeBytes,
      storageId: a.storageId,
      deviceHash: a.deviceHash,
      status: "pending",
      createdAt: Date.now(),
    });
    return { id };
  },
});

// Mint a one-time upload URL for file bytes (client POSTs the Blob).
// Public by necessity (no accounts v1); orphaned blobs are harmless and the
// moderation gate keeps them out of the catalogue. Future: quotas/auth.
export const uploadUrl = mutation({
  args: {},
  returns: v.object({ url: v.string() }),
  handler: async (ctx) => {
    return { url: await ctx.storage.generateUploadUrl() };
  },
});

// My submissions for status tracking (newest first, paginated).
export const mine = query({
  args: {
    deviceHash: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_device", (q) => q.eq("deviceHash", a.deviceHash))
      .order("desc")
      .paginate(a.paginationOpts);
  },
});

// Moderation queue for submissions (paginated). Unverified passphrases get
// `{ verified: false }` — indistinguishable from an empty queue.
export const list = query({
  args: {
    passphrase: v.string(),
    status: v.optional(modStatus),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    if (!isMod(a.passphrase)) {
      return { verified: false as const, page: [], isDone: true, continueCursor: "" };
    }
    const base = a.status
      ? ctx.db.query("submissions").withIndex("by_status", (q) => q.eq("status", a.status!))
      : ctx.db.query("submissions");
    const res = await base.order("desc").paginate(a.paginationOpts);
    return { verified: true as const, ...res };
  },
});

// Approve (inserts a catalogue row) or reject (stores reviewer note).
export const decide = mutation({
  args: {
    passphrase: v.string(),
    id: v.id("submissions"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    note: v.optional(v.string()),
    deviceHash: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, a) => {
    if (!isMod(a.passphrase)) throw new Error("Invalid passphrase");
    const s = await ctx.db.get(a.id);
    if (!s) throw new Error("Submission not found.");
    if (s.status !== "pending") throw new Error("Already decided.");
    const note = a.note?.trim() || undefined;

    if (a.status === "approved") {
      const hash = hashString(`${s.title}:${s.course}:${s.createdAt}`);
      const subId = `sub_${s._id}`;
      let previewUrl = "";
      let downloadUrl = "";
      if (s.storageId) {
        const u = await ctx.storage.getUrl(s.storageId);
        previewUrl = u ?? "";
        downloadUrl = u ?? "";
      }
      await ctx.db.insert("catalogue", {
        id: subId,
        title: s.title,
        subtitle: s.courseName,
        subject: s.subject,
        subjectName: s.subjectName,
        course: s.course,
        courseName: s.courseName,
        type: s.type,
        year: s.year,
        pages: estimatePages(s.sizeBytes, hash),
        upvotes: 0,
        downvotes: 0,
        downloads: 0,
        views: 0,
        contributor: "community",
        contributorName: s.contributorName,
        teacher: s.teacher ?? "",
        cover: hash % 16,
        mimeType: "",
        fileExt: s.fileExt,
        sizeLabel: formatBytes(s.sizeBytes),
        previewUrl,
        downloadUrl,
        createdAt: new Date().toISOString(),
        parents: [],
        college: s.college,
        program: s.program,
        level: s.level,
        levelYear: levelYearOf(s.level),
        semester: s.semester ?? "",
        deptSection: "",
        license: s.license,
        fileId: subId,
        storageId: s.storageId ? String(s.storageId) : undefined,
      });
    }

    await ctx.db.patch(a.id, {
      status: a.status,
      ...(note ? { note } : {}),
      reviewedAt: Date.now(),
    });
    await ctx.db.insert("decisions", {
      targetType: "submission",
      targetId: String(a.id),
      action: a.status,
      ...(note ? { note } : {}),
      deviceHash: a.deviceHash,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

// Public file lookup for community uploads (`sub_<submissionId>` → stored
// file URLs). Used directly by mobile for `sub_` papers; Drive-backed papers
// go through the `files.downloadUrl` action instead.
export const getFile = query({
  args: { subId: v.string() },
  returns: v.union(
    v.object({ previewUrl: v.string(), downloadUrl: v.string() }),
    v.null(),
  ),
  handler: async (ctx, { subId }) => {
    const all = await ctx.db.query("submissions").collect();
    const s = all.find((row) => `sub_${row._id}` === subId);
    if (!s?.storageId) return null;
    const u = await ctx.storage.getUrl(s.storageId);
    if (!u) return null;
    return { previewUrl: u, downloadUrl: u };
  },
});
