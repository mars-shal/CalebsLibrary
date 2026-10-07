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

// 16 tonal covers — a SINGLE-HUE monochromatic ramp in the brand blue family.
// Every bg is a neutral-blue grey (blue leads, R≈G just below B): no orange, no
// second hue, since orange is reserved for calls to action per tokens.css.
//
// MUST stay exactly 16: callers index it with `hash % 16` (convex/driveSync.ts,
// convex/submissions.ts) and BookCover.vue with `cover % COVERS.length`.
// Slots interleave four lightness clusters (deep navy / mid indigo / pale sky /
// paper) so neighbouring shelf cards alternate polarity rather than creeping
// through one blob. `ink` AND `accent` are both >= 4.5:1 vs bg because `accent`
// renders .cover-subject, a real label down to 6.5px.
export const COVERS = [
  { bg: '#101632', ink: '#ffffff', accent: '#bcd2f6' },
  { bg: '#dbe6f3', ink: '#101430', accent: '#3e527e' },
  { bg: '#25356b', ink: '#ffffff', accent: '#d8e8ff' },
  { bg: '#8ba4cc', ink: '#101430', accent: '#1a264a' },
  { bg: '#182053', ink: '#ffffff', accent: '#d3e3fb' },
  { bg: '#ccdaee', ink: '#101430', accent: '#33456b' },
  { bg: '#31437f', ink: '#ffffff', accent: '#e0ecff' },
  { bg: '#a5bbdb', ink: '#101430', accent: '#2c3e6a' },
  { bg: '#131a3e', ink: '#ffffff', accent: '#c6d9f8' },
  { bg: '#e2ecf7', ink: '#101430', accent: '#46597f' },
  { bg: '#1f3566', ink: '#ffffff', accent: '#dbe9ff' },
  { bg: '#93aad0', ink: '#101430', accent: '#22325c' },
  { bg: '#161e4a', ink: '#ffffff', accent: '#cfe0fa' },
  { bg: '#d3e0f0', ink: '#101430', accent: '#3a4d78' },
  { bg: '#2b3d78', ink: '#ffffff', accent: '#e2eeff' },
  { bg: '#9db4d6', ink: '#101430', accent: '#2c3e6a' },
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
