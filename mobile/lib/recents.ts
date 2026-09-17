// Recents — recently-viewed papers (powers "Pick up where you left off").
// Touched on paper open + download completion. Capped at 12, newest first.
// Session-safe through the safe storage layer (memory fallback in previews).
import { getKV, type KV } from './storage';

const storage: KV = getKV('calebs-recents');
const KEY = 'recents.v1';
const MAX = 12;

export interface RecentEntry {
  id: string;
  at: number;
}

function read(): RecentEntry[] {
  try {
    const raw = storage.getString(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as RecentEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(entries: RecentEntry[]): void {
  try {
    storage.set(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    // best-effort
  }
}

export function touchRecent(id: string): void {
  const rest = read().filter((e) => e.id !== id);
  write([{ id, at: Date.now() }, ...rest]);
}

export function getRecents(): RecentEntry[] {
  return read();
}
