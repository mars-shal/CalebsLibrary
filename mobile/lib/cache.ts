// Metadata cache — stale-while-revalidate for facets + papers (Phase 6).
// TTL 24h. Writes happen on every successful query (fire-and-forget);
// reads serve instantly when the network can't. Files (PDF bytes) are NOT
// here — those live in lib/downloads.
import { getKV, type KV } from './storage';
import type { Paper } from '@shared/design';
import type { Facets } from './queries';

const storage: KV = getKV('bellsnotes-cache');
const TTL_MS = 24 * 3600 * 1000;

interface Entry<T> {
  at: number;
  data: T;
}

function read<T>(key: string): Entry<T> | null {
  try {
    const raw = storage.getString(key);
    if (!raw) return null;
    return JSON.parse(raw) as Entry<T>;
  } catch {
    return null;
  }
}

function write(key: string, data: unknown): void {
  try {
    storage.set(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // best-effort
  }
}

function fresh<T>(e: Entry<T> | null): T | null {
  if (!e) return null;
  if (Date.now() - e.at > TTL_MS) return null;
  return e.data;
}

export const cacheKeys = {
  facets: (scope: string) => `facets.${scope}`,
  paper: (id: string) => `paper.${id}`,
};

export function cacheFacets(scope: string, data: Facets): void {
  write(cacheKeys.facets(scope), data);
}

export function getCachedFacets(scope: string): Facets | null {
  return fresh<Facets>(read(cacheKeys.facets(scope)));
}

export function cachePaper(p: Paper): void {
  write(cacheKeys.paper(p.id), p);
}

export function cachePapers(list: Paper[]): void {
  for (const p of list.slice(0, 200)) cachePaper(p);
}

export function getCachedPaper(id: string): Paper | null {
  return fresh<Paper>(read(cacheKeys.paper(id)));
}
