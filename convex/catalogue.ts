// Caleb's Library — Convex catalogue API.
//
// Mobile v2 surface (paginated, indexed — NEVER full-collect):
//  - listByLevelProgram → scoped pages for the onboarding-filtered UI
//  - getByIds           → hydrate visible cards (metrics overlay batches here)
//  - getPaper           → single paper detail
//  - searchPage         → scoped pages + server-side contains prefilter (q)
//                         (client still ranks for relevance)
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
  college: string,
  type: string | undefined,
  paginationOpts: PaginationOptions,
) {
  const filterCollege = college && college !== "all";
  const filterProgram = program && program !== "all";
  const filterLevel = levelYear && levelYear !== "all";

  // No filters at all — full catalogue by recency.
  if (!filterLevel && !filterProgram) {
    const base = ctx.db.query("catalogue").withIndex("by_created");
    const fq = filterCollege
      ? base.filter((q) => q.eq(q.field("college"), college))
      : base;
    const fq2 = type ? fq.filter((q) => q.eq(q.field("type"), type)) : fq;
    return await fq2.order("desc").paginate(paginationOpts);
  }
  // Level only (no program) — use level index + optional college/type filter.
  if (!filterProgram) {
    const base = ctx.db
      .query("catalogue")
      .withIndex("by_level_program_type", (q) => q.eq("levelYear", levelYear));
    let fq = filterCollege
      ? base.filter((q) => q.eq(q.field("college"), college))
      : base;
    if (type) fq = fq.filter((q) => q.eq(q.field("type"), type));
    return await fq.order("desc").paginate(paginationOpts);
  }
  // Program only (no level) — recency + program filter.
  if (!filterLevel) {
    const base = ctx.db.query("catalogue").withIndex("by_created");
    let fq = base.filter((q) => q.eq(q.field("program"), program));
    if (filterCollege) fq = fq.filter((q) => q.eq(q.field("college"), college));
    if (type) fq = fq.filter((q) => q.eq(q.field("type"), type));
    return await fq.order("desc").paginate(paginationOpts);
  }
  // Both level and program — use the compound index.
  const base = ctx.db
    .query("catalogue")
    .withIndex("by_level_program_type", (q) =>
      q.eq("levelYear", levelYear).eq("program", program),
    );
  let fq = filterCollege
    ? base.filter((q) => q.eq(q.field("college"), college))
    : base;
  if (type) fq = fq.filter((q) => q.eq(q.field("type"), type));
  return await fq.order("desc").paginate(paginationOpts);
}

// Scoped, paginated catalogue pages. "all"/"all" falls back to recency
// order; otherwise the level/program index serves the query.
export const listByLevelProgram = query({
  args: {
    levelYear: v.string(),
    program: v.string(),
    college: v.string(),
    type: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    return await paginateScope(ctx, a.levelYear, a.program, a.college, a.type, a.paginationOpts);
  },
});

// Scoped count for detail-screen headers. Same scope semantics as
// listByLevelProgram so the number matches what a widened browse of the
// same scope would traverse — subject/course screens use the ids they
// already facet from to keep header counts and lists self-consistent.
export const countByLevelProgram = query({
  args: {
    levelYear: v.string(),
    program: v.string(),
    college: v.string(),
    subject: v.optional(v.string()),
    course: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const page = await paginateScope(ctx, a.levelYear, a.program, a.college, undefined, {
      numItems: 10000,
      cursor: null,
    });
    return page.page.filter(
      (p) => (a.subject ? p.subject === a.subject : true) && (a.course ? p.course === a.course : true),
    ).length;
  },
});

// Contributors within a scope, optionally narrowed to one subject or
// course. Sorted by contribution count — detail screens render real
// "Top contributors" without shipping the paper bodies to the client.
export const contributorsByLevelProgram = query({
  args: {
    levelYear: v.string(),
    program: v.string(),
    college: v.string(),
    subject: v.optional(v.string()),
    course: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const page = await paginateScope(ctx, a.levelYear, a.program, a.college, undefined, {
      numItems: 10000,
      cursor: null,
    });
    const counts = new Map<string, { name: string; n: number }>();
    for (const p of page.page) {
      if (a.subject && p.subject !== a.subject) continue;
      if (a.course && p.course !== a.course) continue;
      const e = counts.get(p.contributor);
      if (e) e.n += 1;
      else counts.set(p.contributor, { name: p.contributorName, n: 1 });
    }
    return [...counts.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((x, y) => y.n - x.n)
      .slice(0, 12);
  },
});

// Papers for one subject (or course) within the onboarding scope,
// paginated — the server-side version of what subject/course screens
// previously filtered client-side from the first 50 rows.
export const listBySubject = query({
  args: {
    levelYear: v.string(),
    program: v.string(),
    college: v.string(),
    subject: v.string(),
    course: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    const page = await paginateScope(ctx, a.levelYear, a.program, a.college, undefined, a.paginationOpts);
    return {
      ...page,
      page: page.page.filter(
        (p) => p.subject === a.subject && (a.course ? p.course === a.course : true),
      ),
    };
  },
});

// Hydrate a visible set of papers by Drive id (max 50 per call).
// The zod schema admits 100 ids; this handler previously sliced to 50, so
// callers that passed 50–100 ids (Saved capped at 100, Downloads) silently
// lost the tail rows. Slice to the schema's real bound instead.
export const getByIds = zCustomQuery(query, NoOp)({
  args: { ids: z.array(z.string()).max(100) },
  returns: catalogueItemSchema.array(),
  handler: async (ctx, { ids }) => {
    const rows = await Promise.all(
      ids.slice(0, 100).map((id) =>
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

// Scoped pages for search. v2: optional `q` applies a server-side contains
// prefilter (case-insensitive over title/courseName/subjectName/contributor
// — the same haystack the client ranks) so deep scopes stop shipping the
// whole catalogue to the device. Client-side ranking (shared/search.ts)
// still runs as the relevance pass over the prefiltered pages.
// Search terms are normalized to lowercase here, not indexed: scopes are
// single-thousands of papers, and a filter over an index page stays O(page).
export const searchPage = query({
  args: {
    levelYear: v.string(),
    program: v.string(),
    college: v.string(),
    q: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, a) => {
    const page = await paginateScope(ctx, a.levelYear, a.program, a.college, undefined, a.paginationOpts);
    const q = a.q?.trim().toLowerCase();
    if (!q) return page;
    return {
      ...page,
      page: page.page.filter((p) =>
        `${p.title} ${p.courseName} ${p.subjectName} ${p.type} ${p.contributor}`
          .toLowerCase()
          .includes(q),
      ),
    };
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

// getColleges — returns distinct college values from the catalogue.
// Used by onboarding to populate the College step dynamically.
export const getColleges = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("catalogue").collect();
    const colleges = [...new Set(docs.map((d) => d.college).filter(Boolean))].sort();
    return colleges;
  },
});

// Facets — server-side scope aggregation for filters, shelves, and stats.
// Mobile paginates ITEMS but needs whole-scope METADATA (subjects, courses,
// year bounds, counts). This computes it in one scoped read per scope
// change (never polled): derivation mirrors the web store
// (computeCourses/computeSubjects) so numbers match the website.
export const facets = query({
  args: { levelYear: v.string(), program: v.string(), college: v.string() },
  handler: async (ctx, a) => {
    let docs;
    const filterCollege = a.college && a.college !== "all";
    const filterProgram = a.program && a.program !== "all";
    const filterLevel = a.levelYear && a.levelYear !== "all";

    if (!filterLevel && !filterProgram) {
      const base = ctx.db.query("catalogue");
      docs = filterCollege
        ? await base.filter((q) => q.eq(q.field("college"), a.college)).collect()
        : await base.collect();
    } else if (!filterProgram) {
      const base = ctx.db
        .query("catalogue")
        .withIndex("by_level_program_type", (q) => q.eq("levelYear", a.levelYear));
      docs = filterCollege
        ? await base.filter((q) => q.eq(q.field("college"), a.college)).collect()
        : await base.collect();
    } else if (!filterLevel) {
      const base = ctx.db
        .query("catalogue")
        .withIndex("by_created")
        .filter((q) => q.eq(q.field("program"), a.program));
      docs = filterCollege
        ? await base.filter((q) => q.eq(q.field("college"), a.college)).collect()
        : await base.collect();
    } else {
      const base = ctx.db
        .query("catalogue")
        .withIndex("by_level_program_type", (q) =>
          q.eq("levelYear", a.levelYear).eq("program", a.program),
        );
      docs = filterCollege
        ? await base.filter((q) => q.eq(q.field("college"), a.college)).collect()
        : await base.collect();
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

    // Drill-down hierarchy for Browse (college → program → level) with true
    // counts. The client previously rebuilt this from the first 20-row page,
    // which hid every program/level beyond it and mislabeled course numbers
    // ("102") as levels. levelYear is the real level band (1→100 Level).
    const collegeMap = new Map<string, Map<string, Map<string, number>>>();
    for (const p of docs) {
      const col = p.college || "General";
      const prog = p.program || "General";
      const lvl = p.levelYear || "";
      let progs = collegeMap.get(col);
      if (!progs) {
        progs = new Map();
        collegeMap.set(col, progs);
      }
      let levels = progs.get(prog);
      if (!levels) {
        levels = new Map();
        progs.set(prog, levels);
      }
      levels.set(lvl, (levels.get(lvl) || 0) + 1);
    }
    const collegeFacets = [...collegeMap.entries()]
      .map(([name, progs]) => {
        const programs = [...progs.entries()]
          .map(([pname, levels]) => {
            const levelList = [...levels.entries()]
              .map(([key, count]) => ({ key, count }))
              .sort((a, b) => a.key.localeCompare(b.key));
            return {
              name: pname,
              paperCount: levelList.reduce((n, l) => n + l.count, 0),
              levels: levelList,
            };
          })
          .sort((a, b) => b.paperCount - a.paperCount);
        return {
          name,
          paperCount: programs.reduce((n, p) => n + p.paperCount, 0),
          programs,
        };
      })
      .sort((a, b) => b.paperCount - a.paperCount);

    const years = docs.map((p) => p.year);
    return {
      subjects: subjects.map(({ courses: _c, ...s }) => s),
      courses,
      colleges: collegeFacets,
      yearMin: years.length ? Math.min(...years) : 2020,
      yearMax: years.length ? Math.max(...years) : new Date().getFullYear(),
      totalPapers: docs.length,
      contributors: new Set(docs.map((p) => p.contributor)).size,
    };
  },
});
