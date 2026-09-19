// Data hooks — thin, typed wrappers over generated Convex functions.
// Generated api is anyApi-typed; casts to shared types happen HERE so
// screens stay clean. No full-collect calls (G1).
import { usePaginatedQuery, useQuery } from 'convex/react';
import { useEffect, useMemo } from 'react';
import { api } from './convex';
import type { Paper } from '@shared/design';
import { useScope } from './store';
import { cacheFacets, getCachedFacets, cachePaper, getCachedPaper } from './cache';

export interface FacetSubject {
  id: string;
  name: string;
  code: string;
  count: number;
}

export interface FacetCourse {
  id: string;
  name: string;
  code: string;
  level: string;
  subjectId: string;
  displayName: string;
  paperCount: number;
}

export interface FacetLevel {
  key: string;
  count: number;
}

export interface FacetProgram {
  name: string;
  paperCount: number;
  levels: FacetLevel[];
}

export interface FacetCollege {
  name: string;
  paperCount: number;
  programs: FacetProgram[];
}

export interface Facets {
  subjects: FacetSubject[];
  courses: FacetCourse[];
  colleges: FacetCollege[];
  yearMin: number;
  yearMax: number;
  totalPapers: number;
  contributors: number;
}

export function useFacets(opts?: { global?: boolean }): Facets | undefined {
  const { levelYear, program, college } = useScope();
  // `global` ignores the onboarding scope entirely: Browse is a whole-library
  // drill-down, so its college grid must show EVERY college (the scoped call
  // returned only the user's own college and hid the rest with no hint).
  // Home/Search/Subject/Course keep scoped facets — their content is
  // deliberately scope-filtered.
  const scope = opts?.global
    ? { college: '', levelYear: '', program: '' }
    : { college, levelYear, program };
  const key = opts?.global ? '__library__' : `${college}/${levelYear}/${program}`;
  const live = useQuery(api.catalogue.facets, scope) as Facets | undefined;
  useEffect(() => {
    if (live) cacheFacets(key, live);
  }, [live, key]);
  // Stale-while-revalidate: cached scope renders instantly offline.
  return live ?? getCachedFacets(key) ?? undefined;
}

export function useScopedPages(opts?: {
  type?: string;
  college?: string;
  levelYear?: string;
  program?: string;
}) {
  const scope = useScope();
  // Browse passes drill-down overrides; undefined falls back to the saved
  // scope so the server filters the whole list, not just the visible page.
  const college = opts?.college ?? scope.college;
  const levelYear = opts?.levelYear ?? scope.levelYear;
  const program = opts?.program ?? scope.program;
  const res = usePaginatedQuery(
    api.catalogue.listByLevelProgram,
    { levelYear, program, college, type: opts?.type },
    { initialNumItems: 20 },
  );
  return { ...res, results: res.results as Paper[] };
}

// Detail-screen data — server-filtered by subject/course within the saved
// scope, so header counts, contributor lists, and paper lists all describe
// the SAME set (the old client-side page filtering showed counts from
// facets next to empty lists whenever the detail fell outside page 1).
export function useSubjectPapers(subject: string, course?: string) {
  const { levelYear, program, college } = useScope();
  const res = usePaginatedQuery(
    api.catalogue.listBySubject,
    { levelYear, program, college, subject, course },
    { initialNumItems: 50 },
  );
  return { ...res, results: res.results as Paper[] };
}

export function useScopedCount(filter?: { subject?: string; course?: string }) {
  const { levelYear, program, college } = useScope();
  return useQuery(
    api.catalogue.countByLevelProgram,
    filter
      ? { levelYear, program, college, subject: filter.subject, course: filter.course }
      : 'skip',
  ) as number | undefined;
}

export function useScopedContributors(filter?: { subject?: string; course?: string }) {
  const { levelYear, program, college } = useScope();
  return useQuery(
    api.catalogue.contributorsByLevelProgram,
    filter
      ? { levelYear, program, college, subject: filter.subject, course: filter.course }
      : 'skip',
  ) as { id: string; name: string; n: number }[] | undefined;
}

export function useSearchPages(q?: string) {
  const { levelYear, program, college } = useScope();
  const trimmed = q?.trim() ?? '';
  const res = usePaginatedQuery(
    api.catalogue.searchPage,
    { levelYear, program, college, q: trimmed.length >= 2 ? trimmed : undefined },
    { initialNumItems: 50 },
  );
  return { ...res, results: res.results as Paper[] };
}

export function usePaper(id: string): Paper | null | undefined {
  const live = useQuery(api.catalogue.getPaper, { id }) as Paper | null | undefined;
  useEffect(() => {
    if (live) cachePaper(live);
  }, [live]);
  if (!id) return live;
  // A definitive server answer (row OR null = not found) must win; the old
  // `live ?? cached ?? undefined` turned the null answer into undefined
  // ("still loading"), so bad links spun the skeleton forever.
  if (live !== undefined) return live;
  return getCachedPaper(id) ?? undefined; // offline fallback while pending
}

export interface MetricRow {
  paper_id: string;
  reads: number;
  downloads: number;
  upvotes: number;
  downvotes: number;
}

export function useMetrics(ids: string[]): MetricRow[] | undefined {
  // Skip the query entirely when there is nothing visible (saves a round-trip).
  return useQuery(
    api.metrics.getByIds,
    ids.length ? { ids: ids.slice(0, 100) } : 'skip',
  ) as MetricRow[] | undefined;
}

// Overlay REAL metrics onto catalogue items (which ship with hash-seeded
// placeholder stats). First 100 ids per call; callers pass visible slices.
export function useOverlaidPapers(papers: readonly Paper[]): Paper[] {
  const ids = useMemo(() => papers.slice(0, 100).map((p) => p.id), [papers]);
  const rows = useMetrics(ids);
  return useMemo(() => {
    if (!rows?.length) return [...papers];
    const map = new Map(rows.map((r) => [r.paper_id, r]));
    return papers.map((p) => {
      const m = map.get(p.id);
      return m
        ? { ...p, views: m.reads, downloads: m.downloads, upvotes: m.upvotes, downvotes: m.downvotes }
        : p;
    });
  }, [papers, rows]);
}
