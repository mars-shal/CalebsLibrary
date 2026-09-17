// Caleb's Library — Convex catalogue API.
//
// Mobile v2 surface (paginated, indexed — NEVER full-collect):
//  - listByLevelProgram → scoped pages for the onboarding-filtered UI
//  - getByIds           → hydrate visible cards (metrics overlay batches here)
//  - getPaper           → single paper detail
//  - searchPage         → scoped pages; mobile ranks locally (v1, documented)
// Legacy surface (web compat — mobile must NOT call):
//  - get                → full collect (kept for the Vue web app only)
// Internal surface (cron / dashboard only):
//  - replaceAll         → manual reseed only (NEVER on a cron — ban pattern)
//  - applyDiff          → insert/patch/delete diff used by the 12h sync
//  - syncDiffFromDrive  → action: walk Google Drive and apply the diff
//
// Every function validates its inputs/outputs against the shared Zod schema
// (src/schema/catalogue.ts) through convex-helpers' zod4 bindings.
import { z } from "zod";
import { zCustomQuery, zCustomMutation, zCustomAction } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, internalMutation, internalAction, env } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { PaginationOptions } from "convex/server";
import { internal } from "./_generated/api";
import { catalogueItemSchema, syncResultSchema } from "../src/schema/catalogue";
import {
  CODE_SUBJECTS,
  LEVEL_DESC,
  parseCourseName,
  slugify,
} from "../src/schema/catalogue";
import { walkCatalogueTree } from "./driveSync";

// Shared scope resolver: separate fully-typed index queries per branch
// (Convex index-builder chains cannot be built conditionally in one
// expression — each arity needs its own call).
async function paginateScope(
  ctx: QueryCtx,
  levelYear: string,
  program: string,
  type: string | undefined,
  paginationOpts: PaginationOptions,
) {
  if (levelYear === "all" && program === "all") {
    const base = ctx.db.query("catalogue").withIndex("by_created");
    const fq = type
      ? base.filter((q) => q.eq(q.field("type"), type))
      : base;
    return await fq.order("desc").paginate(paginationOpts);
  }
  if (levelYear === "all") {
    // No level-first index exists for program-only scope: recency + filter.
    const base = ctx.db.query("catalogue").withIndex("by_created");
    const fq = base.filter((q) =>
      type
        ? q.and(q.eq(q.field("program"), program), q.eq(q.field("type"), type))
        : q.eq(q.field("program"), program),
    );
    return await fq.order("desc").paginate(paginationOpts);
  }
  if (program === "all") {
    const base = ctx.db
      .query("catalogue")
      .withIndex("by_level_program_type", (q) => q.eq("levelYear", levelYear));
    const fq = type
      ? base.filter((q) => q.eq(q.field("type"), type))
      : base;
    return await fq.order("desc").paginate(paginationOpts);
  }
  const base = ctx.db
    .query("catalogue")
    .withIndex("by_level_program_type", (q) =>
      q.eq("levelYear", levelYear).eq("program", program),
    );
  const fq = type
    ? base.filter((q) => q.eq(q.field("type"), type))
    : base;
  return await fq.order("desc").paginate(paginationOpts);
}

// Scoped, paginated catalogue pages. "all"/"all" falls back to recency
// order; otherwise the level/program index serves the query.
export const listByLevelProgram = query({
  args: {
    levelYear: v.string(),
    program: v.string(),
    type: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    return await paginateScope(ctx, a.levelYear, a.program, a.type, a.paginationOpts);
  },
});

// Hydrate a visible set of papers by Drive id (max 50 per call).
export const getByIds = zCustomQuery(query, NoOp)({
  args: { ids: z.array(z.string()).max(100) },
  returns: catalogueItemSchema.array(),
  handler: async (ctx, { ids }) => {
    const rows = await Promise.all(
      ids.slice(0, 50).map((id) =>
        ctx.db
          .query("catalogue")
          .withIndex("by_drive_id", (q) => q.eq("id", id))
          .first(),
      ),
    );
    return rows.flatMap((r) => (r ? [r] : []));
  },
});

// Single paper detail by Drive id.
export const getPaper = zCustomQuery(query, NoOp)({
  args: { id: z.string() },
  returns: catalogueItemSchema.nullable(),
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query("catalogue")
      .withIndex("by_drive_id", (q) => q.eq("id", id))
      .first();
  },
});

// Scoped pages for client-side ranked search (v1): mobile accumulates pages
// within the user's scope and applies the documented substring ranking
// locally (title^3 + course^2 + subject + contributor). Server-side FTS is
// a future pass, not v1.
export const searchPage = query({
  args: {
    levelYear: v.string(),
    program: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    return await paginateScope(ctx, a.levelYear, a.program, undefined, a.paginationOpts);
  },
});

// Pack ids for bulk download (exam packs): metadata only, course-scoped.
// Bounded by course size (tens of files); never a full-table read.
export const packIds = query({
  args: { course: v.string(), type: v.string() },
  returns: v.array(
    v.object({ id: v.string(), fileExt: v.string(), fileId: v.string() }),
  ),
  handler: async (ctx, a) => {
    const docs =
      a.type === 'all'
        ? await ctx.db
            .query('catalogue')
            .withIndex('by_course_type_year', (q) => q.eq('course', a.course))
            .collect()
        : await ctx.db
            .query('catalogue')
            .withIndex('by_course_type_year', (q) =>
              q.eq('course', a.course).eq('type', a.type),
            )
            .collect();
    return docs.map((d) => ({ id: d.id, fileExt: d.fileExt, fileId: d.fileId }));
  },
});

// LEGACY — full collect for the Vue web app. Mobile must use the paginated
// queries above; every mobile full-table pull is a ban-pattern repeat.
export const get = zCustomQuery(query, NoOp)({
  args: {},
  returns: catalogueItemSchema.array(),
  handler: async (ctx) => {
    return await ctx.db.query("catalogue").collect();
  },
});

// Manual reseed only — wipes and re-inserts the catalogue in one transaction.
// NOT on any cron. Not exposed to clients.
export const replaceAll = zCustomMutation(internalMutation, NoOp)({
  args: { items: catalogueItemSchema.array() },
  returns: syncResultSchema,
  handler: async (ctx, { items }) => {
    const existing = await ctx.db.query("catalogue").collect();
    await Promise.all(existing.map((doc) => ctx.db.delete(doc._id)));
    for (const item of items) {
      await ctx.db.insert("catalogue", item);
    }
    return { count: items.length, syncedAt: Date.now() };
  },
});

// Diff sync — the ONLY scheduled writer. Inserts new files, patches changed
// fields (including level path + license), deletes vanished files. One full
// read per 12h run; writes scale with actual Drive changes, not catalogue size.
export const applyDiff = zCustomMutation(internalMutation, NoOp)({
  args: { items: catalogueItemSchema.array() },
  returns: syncResultSchema,
  handler: async (ctx, { items }) => {
    const existing = await ctx.db.query("catalogue").collect();
    const seen = new Set(items.map((i) => i.id));
    const byId = new Map(existing.map((d) => [d.id, d]));
    for (const item of items) {
      const cur = byId.get(item.id);
      if (!cur) {
        await ctx.db.insert("catalogue", item);
        continue;
      }
      let dirty = false;
      for (const [k, val] of Object.entries(item)) {
        const cv = (cur as unknown as Record<string, unknown>)[k];
        const same = Array.isArray(val)
          ? JSON.stringify(cv) === JSON.stringify(val)
          : cv === val;
        if (!same) {
          dirty = true;
          break;
        }
      }
      if (dirty) await ctx.db.patch(cur._id, { ...item });
    }
    for (const doc of existing) {
      if (!seen.has(doc.id)) await ctx.db.delete(doc._id);
    }
    return { count: items.length, syncedAt: Date.now() };
  },
});

// Internal action — walks Google Drive and applies the diff.
// Scheduled by the 12h cron; not reachable from the client.
// The Drive API key is read from the Convex env (set via `npx convex env set`),
// never from a client-provided value.
export const syncDiffFromDrive = zCustomAction(internalAction, NoOp)({
  args: {},
  returns: syncResultSchema,
  handler: async (ctx) => {
    const items = await walkCatalogueTree(env.GOOGLE_DRIVE_API_KEY);
    await ctx.runMutation(internal.catalogue.applyDiff, { items });
    return { count: items.length, syncedAt: Date.now() };
  },
});

// Facets — server-side scope aggregation for filters, shelves, and stats.
// Mobile paginates ITEMS but needs whole-scope METADATA (subjects, courses,
// year bounds, counts). This computes it in one scoped read per scope
// change (never polled): derivation mirrors the web store
// (computeCourses/computeSubjects) so numbers match the website.
export const facets = query({
  args: { levelYear: v.string(), program: v.string() },
  handler: async (ctx, a) => {
    let docs;
    if (a.levelYear === "all" && a.program === "all") {
      docs = await ctx.db.query("catalogue").collect();
    } else if (a.levelYear === "all") {
      docs = await ctx.db
        .query("catalogue")
        .withIndex("by_created")
        .filter((q) => q.eq(q.field("program"), a.program))
        .collect();
    } else if (a.program === "all") {
      docs = await ctx.db
        .query("catalogue")
        .withIndex("by_level_program_type", (q) => q.eq("levelYear", a.levelYear))
        .collect();
    } else {
      docs = await ctx.db
        .query("catalogue")
        .withIndex("by_level_program_type", (q) =>
          q.eq("levelYear", a.levelYear).eq("program", a.program),
        )
        .collect();
    }

    const courseMap = new Map<string, { name: string; code: string; level: string; display: string }>();
    for (const p of docs) {
      if (!p.course || courseMap.has(p.course)) continue;
      const info = parseCourseName(p.courseName);
      const levelKey = (info.number || "").charAt(0);
      const levelDesc = LEVEL_DESC[levelKey] || "";
      const display = info.parenthetical
        ? `${info.code} ${info.number} — ${info.parenthetical}`
        : levelDesc
          ? `${info.code} ${info.number} — ${levelDesc}`
          : p.courseName;
      courseMap.set(p.course, {
        name: p.courseName,
        code: info.code,
        level: info.number || "",
        display: info.code ? display : p.courseName,
      });
    }
    const counts = new Map<string, number>();
    for (const p of docs) counts.set(p.course, (counts.get(p.course) || 0) + 1);
    const courses = [...courseMap.entries()].map(([id, c]) => ({
      id,
      name: c.name,
      code: c.code,
      level: c.level,
      subjectId: c.code ? slugify(CODE_SUBJECTS[c.code] || c.code) : "general",
      displayName: c.display,
      paperCount: counts.get(id) || 0,
    }));

    const subjMap = new Map<string, { name: string; courses: typeof courses }>();
    for (const c of courses) {
      const existing = subjMap.get(c.subjectId);
      if (existing) existing.courses.push(c);
      else
        subjMap.set(c.subjectId, {
          name: c.code ? CODE_SUBJECTS[c.code] || c.code : "General Studies",
          courses: [c],
        });
    }
    const subjects = [...subjMap.entries()]
      .map(([id, s]) => ({
        id,
        name: s.name,
        code: s.courses[0]?.code ?? "",
        count: s.courses.reduce((n, c) => n + c.paperCount, 0),
        courses: s.courses,
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);

    const years = docs.map((p) => p.year);
    return {
      subjects: subjects.map(({ courses: _c, ...s }) => s),
      courses,
      yearMin: years.length ? Math.min(...years) : 2020,
      yearMax: years.length ? Math.max(...years) : new Date().getFullYear(),
      totalPapers: docs.length,
      contributors: new Set(docs.map((p) => p.contributor)).size,
    };
  },
});
