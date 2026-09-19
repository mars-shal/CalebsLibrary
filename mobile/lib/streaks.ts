// Reading streaks — consecutive-day reading days (device-local, PRD-adjacent
// delight). A "day" counts when any paper is opened (touchRecent callers).
// Grace: today or yesterday counts as "kept"; otherwise the chain restarts
// on the next open. Pure MMKV, no network, no accounts.
import { getKV, type KV } from './storage';

const storage: KV = getKV('bellsnotes-streaks');
const CUR_KEY = 'streak.cur';
const BEST_KEY = 'streak.best';
const LAST_KEY = 'streak.last'; // ISO day of last reading day

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayKey(now: Date): string {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return dayKey(y);
}

export interface StreakInfo {
  current: number;
  best: number;
  /** True when the user has not read today (streak at risk). */
  atRisk: boolean;
}

function readAll(): { current: number; best: number; last: string | null } {
  try {
    return {
      current: Number(storage.getString(CUR_KEY) ?? 0) || 0,
      best: Number(storage.getString(BEST_KEY) ?? 0) || 0,
      last: storage.getString(LAST_KEY) ?? null,
    };
  } catch {
    return { current: 0, best: 0, last: null };
  }
}

export function getStreak(): StreakInfo {
  const { current, best, last } = readAll();
  const today = dayKey(new Date());
  if (current > 0 && last && last !== today && last !== yesterdayKey(new Date())) {
    // The chain broke while away — display resets, but `best` keeps history.
    return { current: 0, best, atRisk: false };
  }
  return { current, best, atRisk: current > 0 && last !== today };
}

// Called from paper opens (touchRecent path). Idempotent per day.
export function markReadingDay(): StreakInfo {
  const now = new Date();
  const today = dayKey(now);
  const { current, best, last } = readAll();
  if (last === today) return getStreak();
  const kept = last === yesterdayKey(now);
  const next = kept ? current + 1 : 1;
  const nextBest = Math.max(best, next);
  try {
    storage.set(CUR_KEY, String(next));
    storage.set(BEST_KEY, String(nextBest));
    storage.set(LAST_KEY, today);
  } catch {
    // best-effort
  }
  return { current: next, best: nextBest, atRisk: false };
}
