// Recent searches — device-local history (max 8, newest first).
// Powers the recent-search chips under the Search bar. Session-safe through
// the safe storage layer.
import { getKV, type KV } from './storage';

const storage: KV = getKV('calebs-search-history');
const KEY = 'recent.v1';
const MAX = 8;

function read(): string[] {
  try {
    const raw = storage.getString(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(terms: string[]): void {
  try {
    storage.set(KEY, JSON.stringify(terms.slice(0, MAX)));
  } catch {
    // best-effort
  }
}

export function getRecentSearches(): string[] {
  return read();
}

export function addRecentSearch(term: string): void {
  const t = term.trim();
  if (!t) return;
  const rest = read().filter((x) => x.toLowerCase() !== t.toLowerCase());
  write([t, ...rest]);
}

export function clearRecentSearches(): void {
  write([]);
}
