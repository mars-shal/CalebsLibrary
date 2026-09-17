// Timetable — this semester's courses (device-local, max 12).
// Powers the "This semester" rail on Home. Course ids come from facets;
// nothing leaves the device.
import { getKV, type KV } from './storage';

const storage: KV = getKV('calebs-timetable');
const KEY = 'courses.v1';
const MAX = 12;

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

function write(ids: string[]): void {
  try {
    storage.set(KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {
    // best-effort
  }
}

export function getMyCourses(): string[] {
  return read();
}

// Returns true when the course is now selected.
export function toggleMyCourse(id: string): boolean {
  const cur = read();
  const has = cur.includes(id);
  const next = has ? cur.filter((x) => x !== id) : [...cur, id].slice(0, MAX);
  write(next);
  return !has;
}

export function clearMyCourses(): void {
  write([]);
}
