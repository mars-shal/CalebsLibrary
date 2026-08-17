// Caleb's Library — shared design data, types, and helpers.
// Ported from design_handoff_calebs_library/src/data.jsx + shared.jsx
import { ref } from 'vue'

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

export interface Paper {
  id: string // Drive file id
  title: string // file name without extension
  subtitle: string
  subject: string // subject id (department code)
  subjectName: string
  course: string // course id (Drive folder id)
  courseName: string // e.g. "CSC 200"
  type: string
  year: number
  pages: number
  upvotes: number
  downloads: number
  views: number
  contributor: string // contributor id
  contributorName: string
  teacher: string
  cover: number
  mimeType: string
  fileExt: string
  sizeLabel: string
  previewUrl: string // drive embed url
  downloadUrl: string
  createdAt: string // ISO date
  parents: string[]
}

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
]

export const PAPER_TYPES = ['Study Guide', 'Lecture Notes', 'Past Exam', 'Problem Set', 'Essay', 'Cheat Sheet', 'Slides', 'Notes']

// Stable string hash — deterministic pseudo-stats per file id
export function hashString(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return Math.abs(h)
}

// Paper type inferred from the real filename — Drive has no type metadata
export function typeFromName(name: string): string {
  const n = name.toLowerCase()
  if (/(past ?question|past ?exam|exam|test)/.test(n)) return 'Past Exam'
  if (/(problem ?set|assignment|tutorial)/.test(n)) return 'Problem Set'
  if (/(cheat ?sheet|formula|summary)/.test(n)) return 'Cheat Sheet'
  if (/(guide|revision|revised)/.test(n)) return 'Study Guide'
  if (/(essay|report|project|thesis)/.test(n)) return 'Essay'
  if (/(slide|lecture|note)/.test(n)) return 'Lecture Notes'
  if (/(ppt|pptx)$/.test(name.toLowerCase())) return 'Slides'
  return 'Notes'
}

export function extFromName(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name)
  return m?.[1]?.toLowerCase() ?? ''
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function timeAgo(iso: string): string {
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
