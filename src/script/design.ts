// Caleb's Library — shared design data, types, and helpers.
// Ported from design_handoff_calebs_library/src/data.jsx + shared.jsx
import { ref } from 'vue'
import type { CatalogueItem } from '@/schema/catalogue'
import {
  hashString,
  typeFromName,
  extFromName,
  formatBytes,
} from '@/schema/catalogue'

export interface Contributor {
  id: string
  name: string
  initials: string
  handle: string
  bio: string
  uploads: number
  founder?: boolean
}

export interface Course {
  id: string // Drive folder id
  name: string // raw folder name, e.g. "CSC 200"
  code: string // department code, e.g. "CSC"
  level: string // level/number, e.g. "200"
  subjectId: string // department code
  displayName: string // e.g. "CSC 200 — Foundation Level"
  paperCount: number
}

export interface Subject {
  id: string // department code, e.g. "CSC"
  name: string // department name, e.g. "Computer Science"
  code: string
  count: number // number of papers
  courses: Course[]
}

// Paper IS the synced catalogue item — single source of truth is the shared
// Zod schema, validated on the Convex side.
export type Paper = CatalogueItem

// Compatibility re-exports (canonical implementations live in @/schema/catalogue).
export { hashString, typeFromName, extFromName, formatBytes }

export interface SearchFilters {
  query: string
  subjects: string[]
  types: string[]
  yearMin: number
  yearMax: number
}

// Contributor registry — populated with REAL Drive owner data by the drive
// store after it loads (see setContributors). Reactive so views that render
// contributor profiles update once the Drive walk completes. Falls back to a
// neutral placeholder before load so views can render immediately.
const FALLBACK_CONTRIBUTOR: Contributor = {
  id: 'community',
  name: 'Community',
  initials: 'CO',
  handle: '@community',
  bio: 'A student-run library, kept by whoever shows up.',
  uploads: 0,
}

const contributorRegistry = ref<Contributor[]>([FALLBACK_CONTRIBUTOR])

export function setContributors(list: Contributor[]): void {
  contributorRegistry.value = list.length > 0 ? list : [FALLBACK_CONTRIBUTOR]
}

export const getContributor = (id: string): Contributor =>
  contributorRegistry.value.find((c) => c.id === id) ?? contributorRegistry.value[0]!

// 16 tonal covers — a NEUTRAL GREYSCALE ramp. Every channel of every value is
// R === G === B: no hue at all, which is what "monochrome" has to mean for a
// book cover. Orange stays reserved for calls to action per tokens.css.
//
// MUST stay exactly 16: callers index it with `hash % 16` (convex/driveSync.ts,
// convex/submissions.ts) and BookCover.vue with `cover % COVERS.length`.
//
// The ramp jumps straight over the mid-grey dead zone (~L 0.183-0.200, roughly
// #6b6b6b-#777777) where neither a light nor a dark ink can clear 4.5:1: the
// darkest dark step here is L 0.107 and the lightest light step is L 0.392, so
// nothing lands in it. Ink polarity alternates per slot because hash assignment
// is effectively random — consecutive indices are always opposite polarity.
// Both `ink` and `accent` clear 4.5:1 vs bg, since `accent` renders
// .cover-subject, a real label down to 6.5px.
export const COVERS = [
  { bg: '#1b1b1b', ink: '#f5f5f5', accent: '#848484' },
  { bg: '#a8a8a8', ink: '#0d0d0d', accent: '#3d3d3d' },
  { bg: '#242424', ink: '#f5f5f5', accent: '#8b8b8b' },
  { bg: '#b8b8b8', ink: '#0d0d0d', accent: '#484848' },
  { bg: '#2e2e2e', ink: '#f5f5f5', accent: '#969696' },
  { bg: '#c9c9c9', ink: '#0d0d0d', accent: '#545454' },
  { bg: '#363636', ink: '#f5f5f5', accent: '#9f9f9f' },
  { bg: '#d1d1d1', ink: '#0d0d0d', accent: '#595959' },
  { bg: '#424242', ink: '#f5f5f5', accent: '#afafaf' },
  { bg: '#dedede', ink: '#0d0d0d', accent: '#616161' },
  { bg: '#4a4a4a', ink: '#f5f5f5', accent: '#bababa' },
  { bg: '#e6e6e6', ink: '#0d0d0d', accent: '#666666' },
  { bg: '#555555', ink: '#f5f5f5', accent: '#cbcbcb' },
  { bg: '#ececec', ink: '#0d0d0d', accent: '#6a6a6a' },
  { bg: '#5c5c5c', ink: '#f5f5f5', accent: '#d5d5d5' },
  { bg: '#f2f2f2', ink: '#0d0d0d', accent: '#6e6e6e' },
]

export const PAPER_TYPES = ['Study Guide', 'Lecture Notes', 'Past Exam', 'Problem Set', 'Essay', 'Cheat Sheet', 'Slides', 'Notes']

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function timeAgo(iso: string | number): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}
