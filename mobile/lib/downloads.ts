// Downloads registry — on-device PDF cache with LRU + pins (PRD §5.7/§12).
// New expo-file-system API (File/Directory/Paths/DownloadTask) + legacy
// pre-flight free-space check. Registry is source of truth; file existence
// re-verified lazily (kill-safe: incomplete entries restart on relaunch).
import { File, Directory, Paths } from 'expo-file-system';
import { getFreeDiskStorageAsync } from 'expo-file-system/legacy';
import { create } from 'zustand';
import { getKV, type KV } from './storage';

export const DOWNLOADS_CAP = 300 * 1024 * 1024;
const REGISTRY_KEY = 'downloads.v1';

const storage: KV = getKV('calebs-downloads');

export interface DownloadEntry {
  id: string;
  ext: string;
  size: number;
  at: number;
  openedAt: number;
  pinned: boolean;
  complete: boolean;
}

function readRegistry(): Record<string, DownloadEntry> {
  try {
    const raw = storage.getString(REGISTRY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DownloadEntry>;
  } catch {
    return {};
  }
}

function writeRegistry(reg: Record<string, DownloadEntry>): void {
  try {
    storage.set(REGISTRY_KEY, JSON.stringify(reg));
  } catch {
    // best-effort
  }
}

const PAPERS_DIR_NAME = 'papers';

async function papersDir(): Promise<Directory> {
  const dir = new Directory(Paths.cache, PAPERS_DIR_NAME);
  try {
    if (!dir.exists) {
      const { makeDirectoryAsync } = await import('expo-file-system/legacy');
      await makeDirectoryAsync(dir.uri, { intermediates: true });
    }
  } catch {
    // exists already or cannot verify — file ops below will surface errors
  }
  return dir;
}

export function fileFor(id: string, ext: string): File {
  return new File(Paths.cache, PAPERS_DIR_NAME, `${id}.${ext || 'pdf'}`);
}

interface RegistryState {
  entries: Record<string, DownloadEntry>;
  refresh: () => void;
  upsert: (e: DownloadEntry) => void;
  remove: (id: string) => void;
}

export const useDownloads = create<RegistryState>((set) => ({
  entries: readRegistry(),
  refresh: () => set({ entries: readRegistry() }),
  upsert: (e) =>
    set((st) => {
      const entries = { ...st.entries, [e.id]: e };
      writeRegistry(entries);
      return { entries };
    }),
  remove: (id) =>
    set((st) => {
      const entries = { ...st.entries };
      delete entries[id];
      writeRegistry(entries);
      return { entries };
    }),
}));

function syncEntry(e: DownloadEntry): void {
  useDownloads.getState().upsert(e);
}

export function storageUsed(): number {
  return Object.values(readRegistry()).reduce((n, e) => n + (e.complete ? e.size : 0), 0);
}

// Evict oldest-unopened unpinned files until `needed` bytes fit.
export async function evictLRU(needed: number): Promise<number> {
  const { track } = await import('./analytics');
  let freed = 0;
  const entries = Object.values(readRegistry())
    .filter((e) => e.complete && !e.pinned)
    .sort((a, b) => a.openedAt - b.openedAt);
  for (const e of entries) {
    if (storageUsed() + needed <= DOWNLOADS_CAP) break;
    try {
      const f = fileFor(e.id, e.ext);
      if (f.exists) f.delete();
    } catch {
      // already gone
    }
    useDownloads.getState().remove(e.id);
    freed += e.size;
  }
  if (freed > 0) track('cache_evict', { freed, reason: 'lru' });
  return freed;
}

export async function isDownloaded(id: string): Promise<boolean> {
  const e = readRegistry()[id];
  if (!e?.complete) return false;
  try {
    const f = fileFor(id, e.ext);
    return f.exists;
  } catch {
    return false;
  }
}

export interface DownloadArgs {
  id: string;
  ext: string;
  url: string;
  sizeBytes?: number;
  onProgress?: (written: number, total: number) => void;
}

// Download with progress. Pre-flights free space (when size known),
// restarts stale partials (kill-safe), enforces the 300MB cap via LRU.
export async function downloadPaper(args: DownloadArgs): Promise<string> {
  const { id, ext, url, sizeBytes = 0, onProgress } = args;
  const dir = await papersDir();
  const dest = new File(dir, `${id}.${ext || 'pdf'}`);

  if (sizeBytes > 0) {
    try {
      const free = await getFreeDiskStorageAsync();
      if (free < sizeBytes + 20 * 1024 * 1024) {
        throw new Error(
          'Not enough storage — free some space or unpin old downloads.',
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Not enough storage')) throw e;
      // space check unavailable — proceed, download errors surface instead
    }
    if (storageUsed() + sizeBytes > DOWNLOADS_CAP) {
      await evictLRU(sizeBytes);
    }
    if (storageUsed() + sizeBytes > DOWNLOADS_CAP) {
      throw new Error('Downloads are full (300MB) — unpin or delete old files.');
    }
  }

  try {
    if (dest.exists) dest.delete();
  } catch {
    // nothing to clear
  }

  const task = File.createDownloadTask(url, dest, {
    onProgress: (p) => onProgress?.(p.bytesWritten, p.totalBytes),
  });
  try {
    await task.downloadAsync();
  } catch (e) {
    try {
      if (dest.exists) dest.delete();
    } catch {
      // ignore cleanup failure
    }
    throw e instanceof Error ? e : new Error('Download failed.');
  }

  let size = sizeBytes;
  try {
    const info = dest.info();
    size = typeof info.size === 'number' ? info.size : sizeBytes;
  } catch {
    // keep declared size
  }
  const entry: DownloadEntry = {
    id,
    ext: ext || 'pdf',
    size,
    at: Date.now(),
    openedAt: Date.now(),
    pinned: readRegistry()[id]?.pinned ?? false,
    complete: true,
  };
  syncEntry(entry);
  return dest.uri;
}

export function touchOpened(id: string): void {
  const reg = readRegistry();
  const e = reg[id];
  if (e) syncEntry({ ...e, openedAt: Date.now() });
}

export function togglePin(id: string): boolean {
  const reg = readRegistry();
  const e = reg[id];
  if (!e) return false;
  syncEntry({ ...e, pinned: !e.pinned });
  return !e.pinned;
}

export async function deletePaper(id: string): Promise<void> {
  const reg = readRegistry();
  const e = reg[id];
  if (e) {
    try {
      const f = fileFor(id, e.ext);
      if (f.exists) f.delete();
    } catch {
      // already gone
    }
  }
  useDownloads.getState().remove(id);
}

export async function clearCache(): Promise<void> {
  const { track } = await import('./analytics');
  const reg = readRegistry();
  const n = Object.keys(reg).length;
  for (const id of Object.keys(reg)) {
    await deletePaper(id);
  }
  if (n > 0) track('cache_evict', { freed: n, reason: 'clear-all' });
}

// Wifi-only prefetch switch (Downloads screen owns the UI; Home owns the job).
const PREFETCH_KEY = 'prefetch.wifi.v1';

export function getPrefetchEnabled(): boolean {
  try {
    const v = storage.getString(PREFETCH_KEY);
    return v === null || v === undefined ? true : v === '1';
  } catch {
    return true;
  }
}

export function setPrefetchEnabled(on: boolean): void {
  try {
    storage.set(PREFETCH_KEY, on ? '1' : '0');
  } catch {
    // best-effort
  }
}

// Resolve a paper to a downloadable URL (shared by Paper + prefetch):
// community uploads via the submissions query, Drive files via the
// request-time action. Throws when unresolvable.
export async function resolvePaperUrl(paper: { id: string; fileId: string }): Promise<string> {
  const { getConvexClient, api } = await import('./convex');
  const client = getConvexClient();
  if (paper.fileId.startsWith('sub_')) {
    const f = await client.query(api.submissions.getFile, { subId: paper.fileId });
    if (!f) throw new Error('File not found.');
    return f.downloadUrl;
  }
  const r = await client.action(api.files.downloadUrl, { fileId: paper.fileId });
  return r.url;
}
