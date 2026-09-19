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

// 16 tonal covers — monochrome, no warm hues
export const COVERS = [
  { bg: '#171717', ink: '#f5f5f5', accent: '#737373' },
  { bg: '#1a1a1a', ink: '#f5f5f5', accent: '#737373' },
  { bg: '#262626', ink: '#f5f5f5', accent: '#a3a3a3' },
  { bg: '#404040', ink: '#f5f5f5', accent: '#d4d4d4' },
  { bg: '#525252', ink: '#f5f5f5', accent: '#e5e5e5' },
  { bg: '#737373', ink: '#f5f5f5', accent: '#fafafa' },
  { bg: '#171717', ink: '#f5f5f5', accent: '#737373' },
  { bg: '#1a1a1a', ink: '#f5f5f5', accent: '#737373' },
  { bg: '#262626', ink: '#f5f5f5', accent: '#a3a3a3' },
  { bg: '#404040', ink: '#f5f5f5', accent: '#d4d4d4' },
  { bg: '#525252', ink: '#f5f5f5', accent: '#e5e5e5' },
  { bg: '#737373', ink: '#f5f5f5', accent: '#fafafa' },
  { bg: '#e5e5e5', ink: '#171717', accent: '#525252' },
  { bg: '#d4d4d4', ink: '#171717', accent: '#404040' },
  { bg: '#a3a3a3', ink: '#171717', accent: '#262626' },
  { bg: '#737373', ink: '#171717', accent: '#171717' },
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
