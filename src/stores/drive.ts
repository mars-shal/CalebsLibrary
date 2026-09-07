// Caleb's Library — catalogue data store (Pinia)
//
// The catalogue is synced to Convex by a server-side cron (convex/cron.ts
// + convex/driveSync.ts), which walks the Google Drive tree and stores the
// results in the `catalogue` table. The browser therefore just reads the synced
// catalogue from Convex — no Drive API calls, no API key in the client bundle.
//
// Vote/view/download metrics are stored in Convex (`metrics` table) and
// overlaid client-side on top of the catalogue items.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contributor, Course, Paper, Subject } from '@/script/design'
import { setContributors } from '@/script/design'
import { convex, api } from '@/script/convex'
import {
  FOUNDER_EMAIL,
  LEVEL_DESC,
  CODE_SUBJECTS,
  slugify,
  parseCourseName,
} from '@/schema/catalogue'

interface MetricRow {
  paper_id: string | number
  reads: number | null
  downloads: number | null
  upvotes: number | null
  downvotes: number | null
}

interface OwnerCount {
  id: string
  name: string
  email: string
  count: number
}

function computeCourses(allPapers: Paper[]): Course[] {
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

  const counts = new Map<string, number>()
  for (const p of allPapers) counts.set(p.course, (counts.get(p.course) || 0) + 1)

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
      paperCount: counts.get(id) || 0,
    })
  }
  return courseList
}

function computeSubjects(courseList: Course[]): Subject[] {
  const subjMap = new Map<string, { name: string; courses: Course[] }>()
  for (const c of courseList) {
    const existing = subjMap.get(c.subjectId)
    if (existing) {
      existing.courses.push(c)
    } else {
      subjMap.set(c.subjectId, { name: c.code ? CODE_SUBJECTS[c.code] || c.code : 'General Studies', courses: [c] })
    }
  }
  return [...subjMap.entries()]
    .map(([id, s]) => ({
      id,
      name: s.name,
      code: s.courses[0]?.code ?? '',
      count: s.courses.reduce((n, c) => n + c.paperCount, 0),
      courses: s.courses,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
}

function applyMetrics(pool: Paper[], rows: MetricRow[]): void {
  const map = new Map<string, { reads: number; downloads: number; upvotes: number; downvotes: number }>()
  for (const row of rows) {
    map.set(String(row.paper_id), {
      reads: Number(row.reads) || 0,
      downloads: Number(row.downloads) || 0,
      upvotes: Number(row.upvotes) || 0,
      downvotes: Number(row.downvotes) || 0,
    })
  }
  for (const p of pool) {
    const m = map.get(p.id)
    if (m) {
      p.views = m.reads
      p.downloads = m.downloads
      p.upvotes = m.upvotes
      p.downvotes = m.downvotes
    }
  }
}

// Contributors are derived purely from the papers' real contributor fields
// (no server-side owner tracking — the founder is ensured via FOUNDER_EMAIL).
function deriveOwners(pool: Paper[]): OwnerCount[] {
  const map = new Map<string, OwnerCount>()
  for (const p of pool) {
    if (!p.contributor) continue
    const existing = map.get(p.contributor)
    if (existing) {
      existing.count += 1
    } else {
      map.set(p.contributor, {
        id: p.contributor,
        name: p.contributorName || p.contributor.split('@')[0] || 'Anonymous',
        email: p.contributor,
        count: 1,
      })
    }
  }
  if (!map.has(FOUNDER_EMAIL)) {
    map.set(FOUNDER_EMAIL, {
      id: FOUNDER_EMAIL,
      name: 'Caleb',
      email: FOUNDER_EMAIL,
      count: 1,
    })
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export const useDriveStore = defineStore('drive', () => {
  const papers = ref<Paper[]>([])
  const courses = ref<Course[]>([])
  const subjects = ref<Subject[]>([])
  const ownerList = ref<OwnerCount[]>([])
  // Start "loading" so the first paint renders skeletons, not the empty/missing
  // states. load() flips it only after the catalogue settles (or cache hydrates).
  const loading = ref(true)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const searchTrends = ref<Record<string, number>>({})

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
    [...papers.value].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5),
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

  // Pull the live metric counters from Convex (parallel-friendly, so load()
  // can fire this while the catalogue query is in flight).
  async function fetchMetrics(): Promise<MetricRow[]> {
    try {
      const rows = await convex.query(api.metrics.getAll, {})
      return rows as MetricRow[]
    } catch (e) {
      console.error('Metrics overlay failed:', e)
      return [] as MetricRow[]
    }
  }

  // ---------- persistence cache (localStorage) ----------
  const CACHE_KEY = 'calebsLibraryCatalogueCache'
  const CACHE_VERSION = '1'

  interface CatalogueCache {
    version: string
    at: number
    papers: Paper[]
    courses: Course[]
    subjects: Subject[]
    owners: OwnerCount[]
  }

  function readCache(): CatalogueCache | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as CatalogueCache
      if (parsed.version !== CACHE_VERSION) return null
      return parsed
    } catch {
      return null
    }
  }

  function writeCache(): void {
    try {
      const payload: CatalogueCache = {
        version: CACHE_VERSION,
        at: Date.now(),
        papers: papers.value,
        courses: courses.value,
        subjects: subjects.value,
        owners: ownerList.value,
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
    } catch {
      // quota exceeded / storage unavailable — cache is best-effort only
    }
  }

  function apply(paperList: Paper[], metricRows: MetricRow[]): void {
    applyMetrics(paperList, metricRows)
    ownerList.value = deriveOwners(paperList)
    setContributors(contributors.value)
    papers.value = paperList
    courses.value = computeCourses(paperList)
    subjects.value = computeSubjects(courses.value)
  }

  // Hydrate from localStorage so the first paint is instant (no network wait).
  // The full Convex fetch then replaces it in the background.
  function hydrateFromCache(): boolean {
    const cache = readCache()
    if (!cache?.papers?.length) return false
    papers.value = cache.papers
    courses.value = cache.courses
    subjects.value = cache.subjects
    ownerList.value = cache.owners
    setContributors(contributors.value)
    error.value = null
    return true
  }

  // ---------- loading ----------
  // Async + progressive: fire the Convex queries in parallel but resolve
  // `load()` as soon as paint-ready state exists, never blocking the UI on the
  // full catalogue round-trip. The heavy work continues in the background.
  let started = false

  async function load(): Promise<void> {
    if (loaded.value || started) return
    started = true
    loading.value = true

    // Paint immediately from the local cache while the network fetch runs.
    hydrateFromCache()
    error.value = null

    try {
      const itemsP = convex.query(api.catalogue.get, {})
      const metricsP = fetchMetrics()
      const trendsP = convex.query(api.trends.getTop, {})

      const items = await itemsP
      const metricRows = await metricsP
      const trendRows = await trendsP

      apply(items, metricRows)
      searchTrends.value = Object.fromEntries(trendRows.map((t) => [t.term, t.score]))
      writeCache()
      loaded.value = true
      loading.value = false
      startAutoRefresh()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load the library'
      console.error('Catalogue load failed:', e)
      loading.value = false
    }
  }

  async function overlayMetrics(pool: Paper[]): Promise<void> {
    try {
      const rows = await convex.query(api.metrics.getAll, {})
      applyMetrics(pool, rows as MetricRow[])
    } catch (e) {
      console.error('Metrics overlay failed:', e)
    }
  }

  async function recordMetric(
    id: string,
    kind: 'reads' | 'downloads' | 'upvotes' | 'downvotes',
    delta: number = 1,
  ): Promise<void> {
    const p = papers.value.find((x) => x.id === id)
    if (!p) return
    if (kind === 'reads') p.views += delta
    else if (kind === 'downloads') p.downloads += delta
    else if (kind === 'upvotes') p.upvotes += delta
    else p.downvotes += delta
    try {
      await convex.mutation(api.metrics.bump, { paper_id: id, kind, delta })
    } catch (e) {
      console.error('Metric bump failed:', e)
    }
  }

  async function recordSearch(term: string): Promise<void> {
    const trimmed = term.trim().toLowerCase()
    if (!trimmed) return
    // Optimistic local bump so the home row reacts instantly; the server
    // aggregates it for everyone via api.trends.record.
    searchTrends.value[trimmed] = (searchTrends.value[trimmed] ?? 0) + 1
    try {
      await convex.mutation(api.trends.record, { term: trimmed })
    } catch (e) {
      console.error('Search trend record failed:', e)
    }
  }

  let refreshTimer: ReturnType<typeof setInterval> | null = null

  async function refresh(): Promise<void> {
    if (!loaded.value || loading.value) return
    try {
      // Re-pull the Convex catalogue so cron updates arrive without a reload.
      const items = await convex.query(api.catalogue.get, {})
      const trendRows = await convex.query(api.trends.getTop, {})

      ownerList.value = deriveOwners(items)
      setContributors(contributors.value)
      papers.value = items
      courses.value = computeCourses(items)
      subjects.value = computeSubjects(courses.value)
      searchTrends.value = Object.fromEntries(trendRows.map((t) => [t.term, t.score]))
      await overlayMetrics(papers.value)
      writeCache()
    } catch {
      // Non-fatal — keep showing the last known good catalogue.
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
    searchTrends,
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
    recordSearch,
  }
})

export type DriveStore = ReturnType<typeof useDriveStore>