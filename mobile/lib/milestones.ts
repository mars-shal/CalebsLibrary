// Milestones — first-download / tenth-save / first-upload celebrations.
// Counters persist (MMKV-safe layer); each milestone fires exactly once.
// Reduced-motion runtimes get the toast only (no burst).
import { getKV, type KV } from './storage';

const storage: KV = getKV('calebs-milestones');

export type MilestoneKind = 'downloads' | 'saves' | 'uploads';

function count(key: string): number {
  try {
    return Number(storage.getString(`count.${key}`) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function seen(key: string): boolean {
  return storage.getString(`seen.${key}`) === '1';
}

function mark(key: string, n: number): void {
  try {
    storage.set(`count.${key}`, String(n));
    storage.set(`seen.${key}`, '1');
  } catch {
    // best-effort
  }
}

const COPY: Record<string, string> = {
  'downloads.first': 'First download — happy offline reading',
  'saves.tenth': '10 papers saved — certified bookworm',
  'uploads.first': 'First contribution — the shelf thanks you',
};

// Returns a celebration message the first time a threshold is crossed,
// otherwise null. Call AFTER the underlying action succeeds.
export function checkMilestone(kind: MilestoneKind, total?: number): string | null {
  if (kind === 'downloads') {
    const n = count('downloads') + 1;
    try {
      storage.set('count.downloads', String(n));
    } catch {
      // ignore
    }
    if (n === 1 && !seen('downloads.first')) {
      mark('downloads.first', n);
      return COPY['downloads.first']!;
    }
    return null;
  }
  if (kind === 'saves') {
    const n = total ?? 0;
    if (n >= 10 && !seen('saves.tenth')) {
      mark('saves.tenth', n);
      return COPY['saves.tenth']!;
    }
    return null;
  }
  if (!seen('uploads.first')) {
    mark('uploads.first', 1);
    return COPY['uploads.first']!;
  }
  return null;
}

// Tiny event bus (no dep): fire from anywhere, hosted once at root.
type Listener = (message: string) => void;
const listeners = new Set<Listener>();

export function onCelebrate(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function celebrate(message: string): void {
  for (const fn of listeners) {
    try {
      fn(message);
    } catch {
      // ignore
    }
  }
}
