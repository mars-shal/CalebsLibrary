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

// 16 tonal covers — indigo/royal/blue spines, plus 4 light sky-tint covers
export const COVERS = [
  { bg: '#1e1660', ink: '#ffffff', accent: '#7c8cad' },
  { bg: '#232a72', ink: '#ffffff', accent: '#93a9ff' },
  { bg: '#1f3a9e', ink: '#ffffff', accent: '#c2d6f0' },
  { bg: '#2b3bd4', ink: '#ffffff', accent: '#d3e3f7' },
  { bg: '#414f7a', ink: '#ffffff', accent: '#e6f0fb' },
  { bg: '#14103a', ink: '#e2dff5', accent: '#6b639f' },
  { bg: '#2b3bd4', ink: '#ffffff', accent: '#f26a1b' },
  { bg: '#1f3a9e', ink: '#ffffff', accent: '#f26a1b' },
  { bg: '#1e1660', ink: '#ffffff', accent: '#f26a1b' },
  { bg: '#2b3bd4', ink: '#0b1440', accent: '#93a9ff' },
  { bg: '#414f7a', ink: '#0b1440', accent: '#e6f0fb' },
  { bg: '#f26a1b', ink: '#1e1660', accent: '#ffffff' },
  { bg: '#e6f0fb', ink: '#1e1660', accent: '#5a6b94' },
  { bg: '#d3e3f7', ink: '#1f3a9e', accent: '#414f7a' },
  { bg: '#c2d6f0', ink: '#232a72', accent: '#1f3a9e' },
  { bg: '#f26a1b', ink: '#ffffff', accent: '#1e1660' },
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
