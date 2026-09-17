// Shared trending rank — framework-free (no localStorage).
// Ported from src/script/trends.ts. The caller passes saved (bookmarked) ids;
// storage lives in the platform layer (MMKV on mobile).
import type { Paper, Subject } from './design';

// Rankings blend three signals: searches for the subject/course names (x10,
// decayed scores from Convex), saved/pinned papers in the subject (x5), and
// lifetime read counts (sqrt dampens the large numbers so per-usage signals
// can still shift the rank).
export function trendingSubjects(
  subjects: readonly Subject[],
  papers: readonly Paper[],
  trends: Record<string, number> = {},
  savedIds: readonly string[] = [],
): Subject[] {
  if (!subjects.length) return [...subjects];
  const saved = new Set(savedIds);
  const papersById = new Map<string, Paper>();
  const viewsBySubject: Record<string, number> = {};
  for (const p of papers) {
    papersById.set(p.id, p);
    viewsBySubject[p.subject] = (viewsBySubject[p.subject] ?? 0) + p.views;
  }
  const score: Record<string, number> = {};
  for (const s of subjects) {
    const subjectName = s.name.toLowerCase();
    const courseText = s.courses
      .map((c) => `${c.name} ${c.displayName} ${c.code}`.toLowerCase())
      .join(' ');
    let searches = 0;
    for (const [term, count] of Object.entries(trends)) {
      if (subjectName.includes(term) || term.includes(subjectName) || courseText.includes(term)) {
        searches += count;
      }
    }
    let saves = 0;
    for (const id of saved) {
      const p = papersById.get(id);
      if (p && p.subject === s.id) saves++;
    }
    score[s.id] = searches * 10 + saves * 5 + Math.sqrt(viewsBySubject[s.id] ?? 0);
  }
  const ranked = [...subjects].sort((a, b) => score[b.id]! - score[a.id]!);
  const anySignal = Object.values(score).some((v) => v > 0);
  // Fresh install (nothing tracked yet) → keep paper-count order.
  return anySignal ? ranked : [...subjects];
}
