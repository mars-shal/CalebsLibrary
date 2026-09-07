// Trending sources for the home "Or browse:" row. Search-term popularity
// comes from Convex (`api.trends.getTop`, recency-decayed site-wide); saved
// (bookmarked) ids stay in localStorage because they're per-device. Convex
// metrics carry cross-user read counts (`p.views`), so ranks adapt as the site
// is used.
import type { Paper, Subject } from '@/script/design'

const BOOKMARKS_KEY = 'calebsLibraryBookmarks'

export function readSavedIds(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

// Rankings blend three signals: searches for the subject/course names (x10,
// decayed scores from Convex), saved/pinned papers in the subject (x5), and
// lifetime read counts (sqrt dampens the large numbers so per-usage signals
// can still shift the rank).
export function trendingSubjects(
  subjects: readonly Subject[],
  papers: readonly Paper[],
  trends: Record<string, number> = {},
): Subject[] {
  if (!subjects.length) return [...subjects]
  const savedIds = new Set(readSavedIds())
  const papersById = new Map<string, Paper>()
  const viewsBySubject: Record<string, number> = {}
  for (const p of papers) {
    papersById.set(p.id, p)
    viewsBySubject[p.subject] = (viewsBySubject[p.subject] ?? 0) + p.views
  }
  const score: Record<string, number> = {}
  for (const s of subjects) {
    const subjectName = s.name.toLowerCase()
    const courseText = s.courses
      .map((c) => `${c.name} ${c.displayName} ${c.code}`.toLowerCase())
      .join(' ')
    let searches = 0
    for (const [term, count] of Object.entries(trends)) {
      if (subjectName.includes(term) || term.includes(subjectName) || courseText.includes(term)) {
        searches += count
      }
    }
    let saves = 0
    for (const id of savedIds) {
      const p = papersById.get(id)
      if (p && p.subject === s.id) saves++
    }
    score[s.id] = searches * 10 + saves * 5 + Math.sqrt(viewsBySubject[s.id] ?? 0)
  }
  const ranked = [...subjects].sort((a, b) => score[b.id]! - score[a.id]!)
  const anySignal = Object.values(score).some((v) => v > 0)
  // Fresh install (nothing tracked yet) → keep the store's paper-count order.
  return anySignal ? ranked : [...subjects]
}