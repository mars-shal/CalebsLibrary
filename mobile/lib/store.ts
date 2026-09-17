// App stores — zustand + MMKV (manual persistence, versioned keys).
// Key map (web → mobile): calebsLibraryBookmarks (same), calebsLibraryVotes
// (same), onboarding.v1 (new), trends.local (new, unpersisted session cache
// for optimistic trending before server round-trip).
import { create } from 'zustand';
import { getKV, type KV } from './storage';

const storage: KV = getKV('calebs-app');

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch {
    // quota/unavailable — persistence is best-effort
  }
}

export type LevelYear = '1' | '2' | '3' | '4' | '5' | 'all';

export interface Scope {
  program: string; // subject id or 'all'
  levelYear: LevelYear;
}

interface OnboardingState extends Scope {
  done: boolean;
  setScope: (s: Partial<Scope>) => void;
  complete: () => void;
  reopen: () => void;
}

const ONBOARDING_KEY = 'onboarding.v1';

const savedScope = readJSON<Scope>(ONBOARDING_KEY, { program: 'all', levelYear: 'all' });

export const useOnboarding = create<OnboardingState>((set) => ({
  program: savedScope.program || 'all',
  levelYear: (savedScope.levelYear as LevelYear) || 'all',
  done: readJSON<boolean>(`${ONBOARDING_KEY}.done`, false),
  setScope: (s) =>
    set((st) => {
      const next = { program: s.program ?? st.program, levelYear: s.levelYear ?? st.levelYear };
      writeJSON(ONBOARDING_KEY, next);
      return next;
    }),
  complete: () => {
    writeJSON(`${ONBOARDING_KEY}.done`, true);
    set({ done: true });
  },
  reopen: () => {
    writeJSON(`${ONBOARDING_KEY}.done`, false);
    set({ done: false });
  },
}));

export function useScope(): Scope {
  const program = useOnboarding((s) => s.program);
  const levelYear = useOnboarding((s) => s.levelYear);
  return { program, levelYear };
}

const BOOKMARKS_KEY = 'calebsLibraryBookmarks';

interface BookmarkState {
  ids: string[];
  toggle: (id: string) => boolean;
  clear: () => void;
}

export const useBookmarks = create<BookmarkState>((set) => ({
  ids: readJSON<string[]>(BOOKMARKS_KEY, []),
  toggle: (id) => {
    let saved = false;
    set((st) => {
      const has = st.ids.includes(id);
      saved = !has;
      const ids = has ? st.ids.filter((x) => x !== id) : [...st.ids, id];
      writeJSON(BOOKMARKS_KEY, ids);
      return { ids };
    });
    return saved;
  },
  clear: () => {
    writeJSON(BOOKMARKS_KEY, []);
    set({ ids: [] });
  },
}));

const VOTES_KEY = 'calebsLibraryVotes';
interface VoteState {
  votes: Record<string, 1 | 0 | -1>;
  setVote: (id: string, v: 1 | 0 | -1) => void;
}

export const useVotes = create<VoteState>((set) => ({
  votes: readJSON<Record<string, 1 | 0 | -1>>(VOTES_KEY, {}),
  setVote: (id, v) =>
    set((st) => {
      const votes = { ...st.votes, [id]: v };
      writeJSON(VOTES_KEY, votes);
      return { votes };
    }),
}));

interface TrendState {
  local: Record<string, number>;
  bumpLocal: (term: string) => void;
}

export const useTrends = create<TrendState>((set) => ({
  local: {},
  bumpLocal: (term) =>
    set((st) => ({ local: { ...st.local, [term]: (st.local[term] ?? 0) + 1 } })),
}));

const LOWDATA_KEY = 'lowdata.v1';

interface LowDataState {
  lowData: boolean;
  toggle: () => void;
}

export const useLowDataFlag = create<LowDataState>((set) => ({
  lowData: readJSON<boolean>(LOWDATA_KEY, false),
  toggle: () =>
    set((st) => {
      const lowData = !st.lowData;
      writeJSON(LOWDATA_KEY, lowData);
      return { lowData };
    }),
}));

export function useLowData(): boolean {
  return useLowDataFlag((s) => s.lowData);
}

export function isLowData(): boolean {
  return readJSON<boolean>(LOWDATA_KEY, false);
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  program: string;
  level: string;
  college?: string;
}

const PROFILE_KEY = 'calebs-profile.v1';

interface SessionState {
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  patchProfile: (p: Partial<Profile>) => void;
  clearProfile: () => void;
}

export const useSession = create<SessionState>((set) => ({
  profile: readJSON<Profile | null>(PROFILE_KEY, null),
  setProfile: (p) => {
    writeJSON(PROFILE_KEY, p);
    set({ profile: p });
  },
  patchProfile: (p) =>
    set((st) => {
      if (!st.profile) return st;
      const profile = { ...st.profile, ...p };
      writeJSON(PROFILE_KEY, profile);
      return { profile };
    }),
  clearProfile: () => {
    writeJSON(PROFILE_KEY, null);
    set({ profile: null });
  },
}));

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
