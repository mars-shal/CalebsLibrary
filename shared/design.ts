// Shared design data — framework-free (no Vue/RN).
// Ported from src/script/design.ts (minus the Vue contributor registry;
// mobile owns its own registry in a store).
import type { CatalogueItem } from './catalogue';

export interface Contributor {
  id: string;
  name: string;
  initials: string;
  handle: string;
  bio: string;
  uploads: number;
  founder?: boolean;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  level: string;
  subjectId: string;
  displayName: string;
  paperCount: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  count: number;
  courses: Course[];
}

export type Paper = CatalogueItem;

export interface SearchFilters {
  query: string;
  subjects: string[];
  types: string[];
  yearMin: number;
  yearMax: number;
}

export const FALLBACK_CONTRIBUTOR: Contributor = {
  id: 'community',
  name: 'Community',
  initials: 'CO',
  handle: '@community',
  bio: 'A student-run library, kept by whoever shows up.',
  uploads: 0,
};

// 16 tonal covers — dark ink on cream, plus 4 inverted cream covers
export const COVERS = [
  { bg: '#171412', ink: '#f5f2ea', accent: '#8f887b' },
  { bg: '#241f1c', ink: '#f5f2ea', accent: '#8f887b' },
  { bg: '#2e2822', ink: '#f5f2ea', accent: '#a29a8b' },
  { bg: '#3d3733', ink: '#f5f2ea', accent: '#b8b1a3' },
  { bg: '#4a423c', ink: '#f5f2ea', accent: '#cec7b3' },
  { bg: '#5c534b', ink: '#f5f2ea', accent: '#ded9cd' },
  { bg: '#171412', ink: '#f5f2ea', accent: '#8f887b' },
  { bg: '#241f1c', ink: '#f5f2ea', accent: '#8f887b' },
  { bg: '#2e2822', ink: '#f5f2ea', accent: '#a29a8b' },
  { bg: '#3d3733', ink: '#f5f2ea', accent: '#b8b1a3' },
  { bg: '#4a423c', ink: '#f5f2ea', accent: '#cec7b3' },
  { bg: '#5c534b', ink: '#f5f2ea', accent: '#ded9cd' },
  { bg: '#ede9dd', ink: '#171412', accent: '#4a423c' },
  { bg: '#e2ddce', ink: '#171412', accent: '#3d3733' },
  { bg: '#ded9cd', ink: '#171412', accent: '#241f1c' },
  { bg: '#cec7b3', ink: '#171412', accent: '#171412' },
];

export const PAPER_TYPES = [
  'Study Guide',
  'Lecture Notes',
  'Past Exam',
  'Problem Set',
  'Essay',
  'Cheat Sheet',
  'Slides',
  'Notes',
];

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function timeAgo(iso: string | number): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}
