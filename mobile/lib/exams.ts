// Exam dates — device-local exam schedule feeding the Home countdown card.
// Ships with the shared-season defaults (finals windows from shared/phrases)
// so the card is useful immediately; users can edit dates per term. Pure
// MMKV, no accounts, no network.
import { getKV, type KV } from './storage';

const storage: KV = getKV('bellsnotes-exams');
const KEY = 'exams.v1';

export interface ExamEntry {
  id: string;
  course: string; // display label, e.g. "CSC 200"
  at: number; // epoch ms of the exam start
}

interface Store {
  exams: ExamEntry[];
}

function read(): Store {
  try {
    const raw = storage.getString(KEY);
    if (!raw) return { exams: [] };
    const parsed = JSON.parse(raw) as Store;
    return { exams: Array.isArray(parsed.exams) ? parsed.exams : [] };
  } catch {
    return { exams: [] };
  }
}

function write(s: Store): void {
  try {
    storage.set(KEY, JSON.stringify(s));
  } catch {
    // best-effort
  }
}

export function getExams(): ExamEntry[] {
  return read().exams.sort((a, b) => a.at - b.at);
}

export function addExam(course: string, at: number): ExamEntry {
  const e: ExamEntry = {
    id: `x${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    course: course.trim() || 'Untitled',
    at,
  };
  write({ exams: [...read().exams, e] });
  return e;
}

export function removeExam(id: string): void {
  write({ exams: read().exams.filter((e) => e.id !== id) });
}

// Next N upcoming exams (today onward); past ones drop off silently.
export function upcomingExams(limit = 3): ExamEntry[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return getExams().filter((e) => e.at >= start.getTime()).slice(0, limit);
}

export function daysUntil(at: number, from = new Date()): number {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((at - start.getTime()) / 86400000));
}
