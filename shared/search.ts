// Shared search — framework-free.
// Ports the web store ranking contract (PRD §5.4): substring match over
// title/subject/course/type/contributor + optional facet filters, with a
// documented relevance score (title^3, course^2, subject/type/contributor^1).
// Server-side FTS is a future pass, not v1.
import type { Paper } from './design';

export interface SearchFilterInput {
  subjects?: string[];
  types?: string[];
  yearMin?: number;
  yearMax?: number;
}

export function filterPapers(
  papers: readonly Paper[],
  query: string,
  filters: SearchFilterInput = {},
): Paper[] {
  const q = query.trim().toLowerCase();
  const { subjects, types, yearMin, yearMax } = filters;
  return papers.filter((p) => {
    if (q) {
      const hay =
        `${p.title} ${p.subjectName} ${p.courseName} ${p.type} ${p.contributorName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (subjects && subjects.length && !subjects.includes(p.subject)) return false;
    if (types && types.length && !types.includes(p.type)) return false;
    if (yearMin && p.year < yearMin) return false;
    if (yearMax && p.year > yearMax) return false;
    return true;
  });
}

export function rankPapers(papers: readonly Paper[], query: string): Paper[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...papers];
  const codeQ = normalizeCode(q);
  const scored = papers.map((p) => {
    let s = 0;
    if (p.title.toLowerCase().includes(q)) s += 3;
    if (p.courseName.toLowerCase().includes(q)) s += 2;
    if (p.subjectName.toLowerCase().includes(q)) s += 1;
    if (p.type.toLowerCase().includes(q)) s += 1;
    if (p.contributorName.toLowerCase().includes(q)) s += 1;
    // Course-code awareness: "CSC200" == "CSC 200".
    if (codeQ && normalizeCode(`${p.courseName} ${p.subtitle}`).includes(codeQ)) s += 5;
    // Typo tolerance: fuzzy word match when nothing hit (cheap, runs on
    // loaded scope only — server FTS stays a future pass).
    if (s === 0 && fuzzyHit(p.title, q)) s += 0.5;
    return { p, s };
  });
  return scored
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.p);
}

// "CSC 200" / "csc200" / "CSC-200" → "CSC200" for code-tolerant matching.
export function normalizeCode(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let cur = i;
    let prevDiag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const nextDiag = prev[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(prev[j]! + 1, cur + 1, prevDiag + cost);
      prevDiag = nextDiag;
      cur = next;
      prev[j] = next;
    }
  }
  return prev[b.length]!;
}

// True when a query word (4+ chars) is within 2 edits of a title word.
function fuzzyHit(title: string, query: string): boolean {
  const titleWords = title.toLowerCase().split(/[^a-z0-9]+/);
  const queryWords = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  for (const qw of queryWords) {
    for (const tw of titleWords) {
      if (tw.length >= 4 && Math.abs(tw.length - qw.length) <= 2 && levenshtein(tw, qw) <= 2) {
        return true;
      }
    }
  }
  return false;
}

// Split text on the query for <mark>-style highlight segments.
export function highlightSegments(text: string, query: string): { text: string; hit: boolean }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, hit: false }];
  const out: { text: string; hit: boolean }[] = [];
  let rest = text;
  let idx = rest.toLowerCase().indexOf(q);
  while (idx !== -1) {
    if (idx > 0) out.push({ text: rest.slice(0, idx), hit: false });
    out.push({ text: rest.slice(idx, idx + q.length), hit: true });
    rest = rest.slice(idx + q.length);
    idx = rest.toLowerCase().indexOf(q);
  }
  if (rest) out.push({ text: rest, hit: false });
  return out;
}
