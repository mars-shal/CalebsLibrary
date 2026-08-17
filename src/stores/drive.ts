// Caleb's Library — Drive data store (Pinia)
// Walks the real Google Drive tree:
//   Root → Level (100–400) → Semester → Dept section (General/Departmental)
//   → [Dept folder] → Course folder → (Notes / Past Questions) → files
// Contributors come from each file's real Drive owner. Votes/views have no
// Drive equivalent, so those remain derived deterministically per file id.
// All file content, titles, dates, sizes, preview and download URLs are REAL
// Drive data.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contributor, Course, Paper, Subject } from '@/script/design'
import {
  setContributors,
  hashString,
  typeFromName,
  extFromName,
  formatBytes,
} from '@/script/design'
import { supabase, fetchApproved, storageUrl, bumpMetric } from '@/script/supabase'
import type { Submission } from '@/script/supabase'

export const API_KEY = 'AIzaSyBbEt7LD6wUK1svHbZ_Cnqw68I6mW0geic'
export const ROOT_FOLDER_ID = '1Au60m0ngWUTCOe-AZt8CuJ5LmfvM_DTR'

const API = 'https://www.googleapis.com/drive/v3'
const FIELDS = 'files(id,name,mimeType,createdTime,size,webViewLink,parents,owners(displayName,emailAddress))'
const MATERIAL_MIME = /pdf|officedocument|image\/|plain|msword|vnd\.ms-/

// The account that owns the root tree — the library founder.
const FOUNDER_EMAIL = 'caleb.library.project@gmail.com'

// code (after stripping BUT- prefix) → department subject name
const CODE_SUBJECTS: Record<string, string> = {
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

const LEVEL_DESC: Record<string, string> = {
  '1': 'Foundation Level',
  '2': 'Intermediate Level',
  '3': 'Advanced Level',
  '4': 'Final Year',
  '5': 'Postgraduate',
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  )
}

// "BUT-MTH 103 (Elementary Mathematics III)" → { code: "MTH", number: "103", parenthetical: "Elementary Mathematics III" }
function parseCourseName(name: string): { code: string; number: string; parenthetical: string } {
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

interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime?: string
  size?: string
  webViewLink?: string
  parents?: string[]
  owners?: { displayName?: string; emailAddress?: string }[]
}

interface OwnerCount {
  id: string
  name: string
  email: string
  count: number
}

async function driveList(parentId: string): Promise<DriveFile[]> {
  const url = `${API}/files?key=${API_KEY}&q=${encodeURIComponent(`'${parentId}' in parents`)}&fields=${FIELDS}&pageSize=1000`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Drive API ${res.status}`)
  const data = await res.json()
  return (data.files || []) as DriveFile[]
}

// Concurrency-limited map over an array
async function pMap<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i]!)
    }
  })
  await Promise.all(workers)
  return results
}

export const useDriveStore = defineStore('drive', () => {
  const papers = ref<Paper[]>([])
  const courses = ref<Course[]>([])
  const subjects = ref<Subject[]>([])
  const ownerList = ref<OwnerCount[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  // ---------- derived values ----------
  const papersBySubject = (subjectId: string): Paper[] =>
    papers.value.filter((p) => p.subject === subjectId)

  const papersByCourse = (courseId: string): Paper[] =>
    papers.value.filter((p) => p.course === courseId)

  const getSubject = (id: string): Subject | undefined =>
    subjects.value.find((s) => s.id === id)

  const getCourse = (id: string): Course | undefined =>
    courses.value.find((c) => c.id === id)

  const getPaper = (id: string): Paper | undefined =>
    papers.value.find((p) => p.id === id)

  const recentPapers = computed<Paper[]>(() =>
    [...papers.value].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 12),
  )

  const lovedPapers = computed<Paper[]>(() =>
    [...papers.value].sort((a, b) => b.upvotes - a.upvotes).slice(0, 8),
  )

  const contributors = computed<Contributor[]>(() => {
    const counts = new Map<string, number>()
    for (const p of papers.value) {
      counts.set(p.contributor, (counts.get(p.contributor) || 0) + 1)
    }
    return ownerList.value.map((o) => ({
      id: o.id,
      name: o.name,
      initials: o.name.split(/[^a-z0-9]+/i).map((w) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'CO',
      handle: `@${o.email.split('@')[0]}`,
      bio: `Contributes across ${counts.get(o.id) || 0} papers in the library.`,
      uploads: counts.get(o.id) || o.count,
      founder: o.email === FOUNDER_EMAIL,
    }))
  })

  const stats = computed(() => ({
    papers: papers.value.length,
    contributors: new Set(papers.value.map((p) => p.contributor)).size,
    reads: Math.round(papers.value.reduce((s, p) => s + p.views, 0) / 12),
    subjects: subjects.value.length,
  }))

  function search(query: string, filters: { subjects?: string[]; types?: string[]; yearMin?: number; yearMax?: number } = {}) {
    const q = query.trim().toLowerCase()
    const { subjects: fs, types, yearMin, yearMax } = filters
    return papers.value.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.subjectName} ${p.courseName} ${p.type} ${p.contributorName}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (fs && fs.length && !fs.includes(p.subject)) return false
      if (types && types.length && !types.includes(p.type)) return false
      if (yearMin && p.year < yearMin) return false
      if (yearMax && p.year > yearMax) return false
      return true
    })
  }

  // ---------- loading ----------
  async function load(): Promise<void> {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const walk = async (
        folderId: string,
        path: { level: string; semester: string; deptSection: string; dept: string; course: string },
        types: string[],
      ): Promise<{ papers: Paper[]; courses: Course[] }> => {
        const files = await driveList(folderId)
        const subFolders = files.filter((f) => f.mimeType === 'application/vnd.google-apps.folder')
        const fileItems = files.filter((f) => f.mimeType !== 'application/vnd.google-apps.folder' && MATERIAL_MIME.test(f.mimeType))

        const here: Paper[] = fileItems.map((f) => buildPaper(f, path, types))
        const childResults = await pMap(subFolders, 6, async (sub) => {
          if (sub.name === 'Notes' || sub.name === 'Past Questions') {
            return walk(sub.id, path, [...types, sub.name])
          }
          // Deeper course-level folders (e.g. department folder)
          const next = { ...path }
          if (path.deptSection === 'Departmental Courses' && !path.dept) {
            next.dept = sub.name
            next.course = ''
          } else if (!path.course) {
            next.course = sub.name
          } else {
            next.course = sub.name // nested course materials
          }
          return walk(sub.id, next, types)
        })

        return {
          papers: [...here, ...childResults.flatMap((r) => r.papers)],
          courses: childResults.flatMap((r) => r.courses),
        }
      }

      const levelFolders = await driveList(ROOT_FOLDER_ID)
      const levelRes = await pMap(levelFolders, 4, async (lvl) => {
        const path = { level: lvl.name, semester: '', deptSection: '', dept: '', course: '' }
        const semesters = await driveList(lvl.id)
        const semRes = await pMap(semesters, 4, async (sem) => {
          const semPath = { ...path, semester: sem.name }
          const sections = await driveList(sem.id)
          const secRes = await pMap(sections, 4, async (sec) => {
            return walk(sec.id, { ...semPath, deptSection: sec.name }, [])
          })
          return { papers: secRes.flatMap((r) => r.papers), courses: secRes.flatMap((r) => r.courses) }
        })
        return { papers: semRes.flatMap((r) => r.papers), courses: semRes.flatMap((r) => r.courses) }
      })

      const allPapers = levelRes.flatMap((r) => r.papers)
      const allCourses = levelRes.flatMap((r) => r.courses)

      // Build courses (dedupe by folder id via paper.course)
      const courseMap = new Map<string, { name: string; code: string; level: string; display: string }>()
      for (const p of allPapers) {
        if (!p.course || courseMap.has(p.course)) continue
        const info = parseCourseName(p.courseName)
        const levelKey = (info.number || '').charAt(0)
        const levelDesc = LEVEL_DESC[levelKey] || ''
        const display = info.parenthetical
          ? `${info.code} ${info.number} — ${info.parenthetical}`
          : levelDesc
            ? `${info.code} ${info.number} — ${levelDesc}`
            : p.courseName
        courseMap.set(p.course, {
          name: p.courseName,
          code: info.code,
          level: info.number || '',
          display: info.code ? display : p.courseName,
        })
      }

      const courseList: Course[] = []
      for (const [id, c] of courseMap) {
        const subjId = c.code ? slugify(CODE_SUBJECTS[c.code] || c.code) : 'general'
        courseList.push({
          id,
          name: c.name,
          code: c.code,
          level: c.level,
          subjectId: subjId,
          displayName: c.display,
          paperCount: allPapers.filter((p) => p.course === id).length,
        })
      }

      // Build subjects
      const subjMap = new Map<string, { name: string; courses: Course[] }>()
      for (const c of courseList) {
        const existing = subjMap.get(c.subjectId)
        if (existing) {
          existing.courses.push(c)
        } else {
          subjMap.set(c.subjectId, { name: c.code ? CODE_SUBJECTS[c.code] || c.code : 'General Studies', courses: [c] })
        }
      }
      subjects.value = [...subjMap.entries()]
        .map(([id, s]) => ({
          id,
          name: s.name,
          code: s.courses[0]?.code ?? '',
          count: s.courses.reduce((n, c) => n + c.paperCount, 0),
          courses: s.courses,
        }))
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count)

      papers.value = allPapers
      courses.value = courseList

      const approved = await mergeApproved()
      const merged = [...allPapers, ...approved]
      await overlayMetrics(merged)

      ownerList.value = [...ownersById.values()].sort((a, b) => b.count - a.count)
      setContributors(contributors.value)
      papers.value = merged
      loaded.value = true
      startAutoRefresh()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load the library'
      console.error('Drive load failed:', e)
    } finally {
      loading.value = false
    }
  }

  const ownersById = new Map<string, OwnerCount>()

  function trackOwner(f: DriveFile): void {
    const owner = f.owners?.[0]
    if (!owner?.emailAddress) return
    const existing = ownersById.get(owner.emailAddress)
    if (existing) {
      existing.count += 1
    } else {
      ownersById.set(owner.emailAddress, {
        id: owner.emailAddress,
        name: owner.displayName || owner.emailAddress.split('@')[0] || 'Anonymous',
        email: owner.emailAddress,
        count: 1,
      })
    }
  }

  function buildPaper(f: DriveFile, path: { level: string; semester: string; deptSection: string; dept: string; course: string }, types: string[]): Paper {
    const hash = hashString(f.id)
    const fileName = f.name
    const title = fileName.replace(/\.[^.]+$/, '')
    const courseName = path.course || path.dept || 'General'
    const courseInfo = parseCourseName(courseName)
    const subjectName = courseInfo.code
      ? CODE_SUBJECTS[courseInfo.code] || courseInfo.code
      : 'General Studies'
    const subject = courseInfo.code
      ? slugify(CODE_SUBJECTS[courseInfo.code] || courseInfo.code)
      : 'general'
    const sizeBytes = Number(f.size) || 0
    const type = detectType(fileName, types)
    trackOwner(f)
    const owner = f.owners?.[0]
    const contributorId = owner?.emailAddress || 'anonymous'
    const contributorName = owner?.displayName || owner?.emailAddress?.split('@')[0] || 'Anonymous'
    return {
      id: f.id,
      title,
      subtitle: courseInfo.code ? `${courseInfo.code} ${courseInfo.number}` : courseName,
      subject,
      subjectName,
      course: path.course || path.dept || f.id,
      courseName,
      type,
      year: f.createdTime ? new Date(f.createdTime).getFullYear() : new Date().getFullYear(),
      pages: estimatePages(sizeBytes, hash),
      upvotes: 40 + (hash % 900),
      downloads: 200 + ((hash >> 4) % 3000),
      views: 600 + ((hash >> 8) % 12000),
      contributor: contributorId,
      contributorName,
      teacher: '',
      cover: hash % 16,
      mimeType: f.mimeType,
      fileExt: extFromName(fileName),
      sizeLabel: sizeBytes ? formatBytes(sizeBytes) : '—',
      previewUrl: `https://drive.google.com/file/d/${f.id}/preview`,
      downloadUrl: `${API}/files/${f.id}?alt=media&key=${API_KEY}`,
      createdAt: f.createdTime || new Date().toISOString(),
      parents: f.parents || [],
    }
  }

  function detectType(fileName: string, types: string[]): string {
    const n = fileName.toLowerCase()
    if (/(past ?question|exam|test)/.test(n) || types.includes('Past Questions')) return 'Past Exam'
    if (/(assign|problem|tutorial|worksheet)/.test(n)) return 'Problem Set'
    if (/(cheat ?sheet|formula|summary)/.test(n)) return 'Cheat Sheet'
    if (/(guide|revision)/.test(n)) return 'Study Guide'
    if (/(essay|report|project)/.test(n)) return 'Essay'
    if (/(slide|lecture|note)/.test(n) || types.includes('Notes') || /\.pptx?$/i.test(fileName)) return 'Lecture Notes'
    return 'Notes'
  }

  function paperFromSubmission(s: Submission): Paper {
    const id = `sub-${s.id}`
    const hash = hashString(id)
    const sizeBytes = Number(s.file_size) || 0
    const hasDrive = !!s.drive_file_id
    return {
      id,
      title: s.title,
      subtitle: s.course_name || s.subject_name,
      subject: s.subject,
      subjectName: s.subject_name,
      course: s.course || id,
      courseName: s.course_name || 'Community upload',
      type: s.type,
      year: new Date(s.created_at).getFullYear(),
      pages: estimatePages(sizeBytes, hash),
      upvotes: 0,
      downloads: 0,
      views: 0,
      contributor: s.contributor_email,
      contributorName: s.contributor_name,
      teacher: '',
      cover: hash % 16,
      mimeType: s.mime_type,
      fileExt: extFromName(s.file_name),
      sizeLabel: sizeBytes ? formatBytes(sizeBytes) : '—',
      previewUrl: hasDrive
        ? `https://drive.google.com/file/d/${s.drive_file_id}/preview`
        : storageUrl(s.storage_path),
      downloadUrl: hasDrive
        ? `${API}/files/${s.drive_file_id}?alt=media&key=${API_KEY}`
        : storageUrl(s.storage_path),
      createdAt: s.created_at,
      parents: [],
    }
  }

  async function mergeApproved(): Promise<Paper[]> {
    try {
      const approved = await fetchApproved()
      const subPapers = approved.map(paperFromSubmission)
      const counts = new Map<string, number>()
      for (const p of subPapers) {
        counts.set(p.contributor, (counts.get(p.contributor) || 0) + 1)
      }
      for (const [email, count] of counts) {
        if (ownersById.has(email)) continue
        ownersById.set(email, {
          id: email,
          name: subPapers.find((p) => p.contributor === email)?.contributorName || email.split('@')[0] || 'Anonymous',
          email,
          count,
        })
      }
      return subPapers
    } catch (e) {
      console.error('Supabase merge failed:', e)
      return []
    }
  }

  async function overlayMetrics(pool: Paper[]): Promise<void> {
    try {
      const { data } = await supabase.from('metrics').select('paper_id, reads, downloads, upvotes')
      const map = new Map<string, { reads: number; downloads: number; upvotes: number }>()
      for (const row of data || []) {
        map.set(row.paper_id as string, {
          reads: Number(row.reads) || 0,
          downloads: Number(row.downloads) || 0,
          upvotes: Number(row.upvotes) || 0,
        })
      }
      for (const p of pool) {
        const m = map.get(p.id)
        if (m) {
          p.views = m.reads
          p.downloads = m.downloads
          p.upvotes = m.upvotes
        }
      }
    } catch (e) {
      console.error('Metrics overlay failed:', e)
    }
  }

  async function recordMetric(id: string, kind: 'reads' | 'downloads' | 'upvotes'): Promise<void> {
    const p = papers.value.find((x) => x.id === id)
    if (!p) return
    const bases = { reads: p.views, downloads: p.downloads, upvotes: p.upvotes }
    if (kind === 'reads') p.views += 1
    else if (kind === 'downloads') p.downloads += 1
    else p.upvotes += 1
    try {
      await bumpMetric(id, kind, bases)
    } catch (e) {
      console.error('Metric bump failed:', e)
    }
  }

  function estimatePages(bytes: number, hash: number): number {
    if (bytes > 0) {
      const bySize = Math.round(bytes / 30000)
      return Math.min(250, Math.max(2, bySize))
    }
    return 6 + (hash % 40)
  }

  let refreshTimer: ReturnType<typeof setInterval> | null = null

  async function refresh(): Promise<void> {
    if (!loaded.value || loading.value) return
    try {
      const existing = new Set(papers.value.map((p) => p.id))
      const approved = await fetchApproved()
      const fresh = approved.filter((s) => {
        const pid = `sub-${s.id}`
        return !existing.has(pid)
      })
      if (fresh.length) {
        const newPapers = fresh.map(paperFromSubmission)
        for (const s of fresh) {
          const pid = `sub-${s.id}`
          if (!ownersById.has(s.contributor_email)) {
            ownersById.set(s.contributor_email, {
              id: s.contributor_email,
              name: s.contributor_name,
              email: s.contributor_email,
              count: 1,
            })
          }
        }
        papers.value = [...papers.value, ...newPapers]
        ownerList.value = [...ownersById.values()].sort((a, b) => b.count - a.count)
        setContributors(contributors.value)
      }
      await overlayMetrics(papers.value)
    } catch {
    }
  }

  function startAutoRefresh(): void {
    if (refreshTimer) return
    refreshTimer = setInterval(refresh, 30000)
  }

  function stopAutoRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  const founder = computed<Contributor | undefined>(() =>
    contributors.value.find((c) => c.founder),
  )

  return {
    papers,
    courses,
    subjects,
    loading,
    loaded,
    error,
    papersBySubject,
    papersByCourse,
    getSubject,
    getCourse,
    getPaper,
    recentPapers,
    lovedPapers,
    contributors,
    founder,
    stats,
    search,
    load,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    recordMetric,
    paperFromSubmission,
  }
})

export type DriveStore = ReturnType<typeof useDriveStore>
