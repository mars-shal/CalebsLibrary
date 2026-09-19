// Downloads registry — on-device PDF cache with LRU + pins (PRD §5.7/§12).
// New expo-file-system API (File/Directory/Paths/DownloadTask) + legacy
// pre-flight free-space check. Registry is source of truth; file existence
// re-verified lazily (kill-safe: incomplete entries restart on relaunch).
// v2: files live under Paths.document (NOT Paths.cache) so the OS never
// wipes "saved offline" papers under storage pressure; a one-time migration
// moves any pre-v2 cache-dir files over.
import { File, Directory, Paths } from 'expo-file-system';
import { getFreeDiskStorageAsync } from 'expo-file-system/legacy';
import { create } from 'zustand';
import { getKV, type KV } from './storage';

export const DOWNLOADS_CAP = 300 * 1024 * 1024;
const REGISTRY_KEY = 'downloads.v1';

const storage: KV = getKV('bellsnotes-downloads');

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
const MIGRATED_KEY = 'migrated.document.v1';

// Papers live in the document directory (user-visible, never auto-wiped).
async function papersDir(): Promise<Directory> {
  const dir = new Directory(Paths.document, PAPERS_DIR_NAME);
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
  return new File(Paths.document, PAPERS_DIR_NAME, `${id}.${ext || 'pdf'}`);
}

// One-time migration: pre-v2 builds stored papers in Paths.cache, which the
// OS clears under pressure. Move complete files into the document dir and
// rewrite the registry; entries whose files vanished are dropped.
export async function migrateToDocumentDir(): Promise<void> {
  if (storage.getString(MIGRATED_KEY) === '1') return;
  try {
    const reg = readRegistry();
    const legacyDir = new Directory(Paths.cache, PAPERS_DIR_NAME);
    for (const [id, e] of Object.entries(reg)) {
      if (!e.complete) continue;
      const dest = fileFor(id, e.ext);
      if (dest.exists) continue;
      try {
        const src = new File(legacyDir, `${id}.${e.ext}`);
        if (src.exists) src.move(dest);
        else throw new Error('gone');
      } catch {
        useDownloads.getState().remove(id); // file lost — re-download later
      }
    }
    storage.set(MIGRATED_KEY, '1');
  } catch {
    // best-effort — retry next launch
  }
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
// sizeBytes=0 (unknown) is corrected from the first progress tick, so the
// cap + space checks engage mid-download instead of never.
export async function downloadPaper(args: DownloadArgs): Promise<string> {
  const { id, ext, url, sizeBytes = 0, onProgress } = args;
  const dir = await papersDir();
  const dest = new File(dir, `${id}.${ext || 'pdf'}`);
  let declared = sizeBytes;
  let capChecked = declared <= 0; // skip the cap pre-check when size unknown

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
    onProgress: (p) => {
      // First tick reveals the true size: run the LRU cap check that was
      // skipped pre-flight, and fail fast when the file can never fit.
      if (!capChecked && p.totalBytes > 0) {
        capChecked = true;
        declared = p.totalBytes;
        void (async () => {
          if (storageUsed() + declared > DOWNLOADS_CAP) {
            await evictLRU(declared);
            if (storageUsed() + declared > DOWNLOADS_CAP) {
              try {
                task.cancel();
              } catch {
                // already finished/failed
              }
            }
          }
        })();
      }
      onProgress?.(p.bytesWritten, p.totalBytes);
    },
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

  let size = declared;
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

// True content URI for viewers/intents (expo-file-system v2 API).
export function contentUriFor(id: string, ext: string): string {
  return fileFor(id, ext).uri;
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
