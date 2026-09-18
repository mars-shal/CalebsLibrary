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

export interface Facets {
  subjects: FacetSubject[];
  courses: FacetCourse[];
  yearMin: number;
  yearMax: number;
  totalPapers: number;
  contributors: number;
}

export function useFacets(): Facets | undefined {
  const { levelYear, program } = useScope();
  const key = `${levelYear}/${program}`;
  const live = useQuery(api.catalogue.facets, { levelYear, program }) as Facets | undefined;
  useEffect(() => {
    if (live) cacheFacets(key, live);
  }, [live, key]);
  // Stale-while-revalidate: cached scope renders instantly offline.
  return live ?? getCachedFacets(key) ?? undefined;
}

export function useScopedPages(type?: string) {
  const { levelYear, program } = useScope();
  const res = usePaginatedQuery(
    api.catalogue.listByLevelProgram,
    { levelYear, program, type },
    { initialNumItems: 20 },
  );
  return { ...res, results: res.results as Paper[] };
}

export function useSearchPages(q?: string) {
  const { levelYear, program } = useScope();
  // Server-side contains-prefilter (convex/catalogue.ts searchPage): scopes
  // stay small but deep ones previously paged the whole catalogue to the
  // device before client filtering. Debounce is owned by the caller (typing
  // states change this arg at most every ~300ms).
  const trimmed = q?.trim() ?? '';
  const res = usePaginatedQuery(
    api.catalogue.searchPage,
    { levelYear, program, q: trimmed.length >= 2 ? trimmed : undefined },
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
  return live ?? getCachedPaper(id) ?? undefined;
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
