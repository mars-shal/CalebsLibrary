// Caleb's Library — shared catalogue schema + pure helpers.
// Single source of truth for the catalogue item shape, used by BOTH the
// Convex backend (convex/*) and the Vue frontend (src/*).
// IMPORTANT: this module must stay framework-agnostic (no Vue/`import.meta.env`)
// so Convex can bundle it server-side.

import { z } from 'zod'

// NOTE: Drive-walking internals (ROOT_FOLDER_ID, DRIVE_API, DRIVE_FIELDS,
// MATERIAL_MIME, DriveFile, detectType) live server-side in convex/driveSync.ts
// so nothing Drive-related ships to the client bundle. The API key is a Convex
// env var; the client only ever receives URLs baked server-side.

// The account that owns the root tree — the library founder.
export const FOUNDER_EMAIL = 'caleb.library.project@gmail.com'

// code (after stripping BUT- prefix) → department subject name
export const CODE_SUBJECTS: Record<string, string> = {
  CSC: 'Computer Science',
  CPE: 'Computer Engineering',
  CEN: 'Computer Engineering',
  ICT: 'Information & Communication Technology',
  TEL: 'Telecommunications Engineering',
  EEE: 'Electrical / Electronics Engineering',
  ELE: 'Electrical / Electronics Engineering',
  MCE: 'Mechanical Engineering',
  MME: 'Mechatronics Engineering',
  CVE: 'Civil Engineering',
  CHE: 'Chemical Engineering',
  CHM: 'Chemistry',
  AGE: 'Agricultural Engineering',
  AGB: 'Agricultural Engineering',
  BME: 'Biomedical Engineering',
  MTH: 'Mathematics',
  STA: 'Statistics',
  PHY: 'Physics',
  GST: 'General Studies',
  LAB: 'Laboratory',
  WSP: 'Workshop',
}

export const LEVEL_DESC: Record<string, string> = {
  '1': 'Foundation Level',
  '2': 'Intermediate Level',
  '3': 'Advanced Level',
  '4': 'Final Year',
  '5': 'Postgraduate',
}

// ---------------------------------------------------------------------------
// Zod schema — the single source of truth for a catalogue item (a Paper).
// ---------------------------------------------------------------------------
export const catalogueItemSchema = z.object({
  id: z.string(), // Drive file id
  title: z.string(), // file name without extension
  subtitle: z.string(),
  subject: z.string(), // subject id (department code slug)
  subjectName: z.string(),
  course: z.string(), // course id (Drive folder id)
  courseName: z.string(), // e.g. "CSC 200"
  type: z.string(),
  year: z.number(),
  pages: z.number(),
  upvotes: z.number(),
  downvotes: z.number(),
  downloads: z.number(),
  views: z.number(),
  contributor: z.string(), // contributor id (owner email)
  contributorName: z.string(),
  teacher: z.string(),
  cover: z.number(),
  mimeType: z.string(),
  fileExt: z.string(),
  sizeLabel: z.string(),
  previewUrl: z.string(), // drive embed url
  downloadUrl: z.string(),
  createdAt: z.string(), // ISO date
  parents: z.array(z.string()),
})
export type CatalogueItem = z.infer<typeof catalogueItemSchema>

export const syncResultSchema = z.object({
  count: z.number(),
  syncedAt: z.number(),
})
export type SyncResult = z.infer<typeof syncResultSchema>

// ---------------------------------------------------------------------------
// Pure helpers (shared client + server).
// ---------------------------------------------------------------------------
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  )
}

// "BUT-MTH 103 (Elementary Mathematics III)" → { code: "MTH", number: "103", parenthetical: "Elementary Mathematics III" }
export function parseCourseName(name: string): { code: string; number: string; parenthetical: string } {
  const cleaned = name.replace(/^BUT-/i, '')
  const m = /^([A-Za-z]{2,6})\s*(\d{3})\s*(?:\(([^)]*)\))?/.exec(cleaned)
  if (m) {
    return {
      code: m[1]?.toUpperCase() ?? '',
      number: m[2] ?? '',
      parenthetical: (m[3] ?? '').trim(),
    }
  }
  return { code: '', number: '', parenthetical: '' }
}

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

// Pages estimated from byte size (deterministic per-file hash fallback)
export function estimatePages(bytes: number, hash: number): number {
  if (bytes > 0) {
    const bySize = Math.round(bytes / 30000)
    return Math.min(250, Math.max(2, bySize))
  }
  return 6 + (hash % 40)
}