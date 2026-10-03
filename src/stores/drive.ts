// Caleb's Library — catalogue data store (Pinia)
//
// The catalogue is synced to Convex by a server-side cron (convex/crons.ts
// + convex/driveSync.ts), which walks the Google Drive tree and stores the
// results in the `catalogue` table. The browser therefore just reads the synced
// catalogue — no Drive API calls, no API key in the client bundle.
//
// READ PATH
// The store reads through `/api/catalogue`, a Vercel function that serves a
// prebuilt read model from Upstash Redis (convex/snapshot.ts writes it). That
// exists because the old path — `catalogue.get` + `metrics.getAll` +
// `trends.getTop`, three full-table collects every 30 seconds per open tab —
// consumed the entire Convex Free data-egress budget in a single afternoon.
// The polling window is now 10 minutes, pauses on a hidden tab, and an
// unchanged poll costs about thirty bytes (a 204) instead of the whole library.
//
// If the endpoint is unreachable — which includes every `vite dev` session,
// where there is no Vercel function — the store transparently falls back to the
// original Convex queries. Redis is an optimisation here, never a dependency.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contributor, Course, Paper, Subject } from '@/script/design'
import { setContributors } from '@/script/design'
import { convex, api } from '@/script/convex'
import { captureAppException, captureAppMessage } from '@/script/sentry'
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

  // Pull the live metric counters from Convex (fallback path only — the
  // snapshot already carries them).
  async function fetchMetrics(): Promise<MetricRow[]> {
    try {
      const rows = await convex.query(api.metrics.getAll, {})
      return rows as MetricRow[]
    } catch (e) {
      captureAppException(e, { fn: 'fetchMetrics' })
      return [] as MetricRow[]
    }
  }

  // ---------- persistence cache (localStorage) ----------
  // NOTE: the key still says "bellsnotes". It is only a localStorage key, so
  // renaming it would just invalidate every existing user's cache for no gain.
  const CACHE_KEY = 'bellsnotesCatalogueCache'
  // Bumped from 1 to 2: the cached shape gained `snapshotVersion`, so a v1 entry
  // is ignored rather than misread as "no snapshot version yet".
  const CACHE_VERSION = '2'

  interface CatalogueCache {
    version: string
    at: number
    snapshotVersion: number
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

  function writeCache(snapshotVersion: number): void {
    try {
      const payload: CatalogueCache = {
        version: CACHE_VERSION,
        at: Date.now(),
        snapshotVersion,
        papers: papers.value,
        courses: courses.value,
        subjects: subjects.value,
        owners: ownerList.value,
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
    } catch (e) {
      // Quota exceeded / storage unavailable — the cache is best-effort only,
      // but a failure here is worth knowing about.
      captureAppException(e, { fn: 'writeCache' })
    }
  }

  // Serialising the full catalogue is a synchronous main-thread cost, and the
  // old code did it on every 30s tick regardless of whether anything changed.
  // Now it is throttled and only runs when there is something new to store.
  const CACHE_WRITE_MIN_INTERVAL_MS = 5 * 60 * 1000
  let cacheDirty = false
  let lastCacheWrite = 0

  function flushCache(force = false): void {
    if (!cacheDirty) return
    if (!force && Date.now() - lastCacheWrite < CACHE_WRITE_MIN_INTERVAL_MS) return
    writeCache(snapshotVersion)
    cacheDirty = false
    lastCacheWrite = Date.now()
  }

  function apply(paperList: Paper[], metricRows: MetricRow[]): void {
    applyMetrics(paperList, metricRows)
    ownerList.value = deriveOwners(paperList)
    setContributors(contributors.value)
    papers.value = paperList
    courses.value = computeCourses(paperList)
    subjects.value = computeSubjects(courses.value)
    cacheDirty = true
  }

  // Hydrate from localStorage so the first paint is instant (no network wait).
  // The network fetch then replaces it in the background.
  function hydrateFromCache(): boolean {
    const cache = readCache()
    if (!cache?.papers?.length) return false
    snapshotVersion = cache.snapshotVersion ?? 0
    papers.value = cache.papers
    courses.value = cache.courses
    subjects.value = cache.subjects
    ownerList.value = cache.owners
    setContributors(contributors.value)
    error.value = null
    cacheDirty = false
    return true
  }

  // ---------- read path ----------
  //
  // `/api/catalogue` is a Vercel function. It is not available under
  // `vite dev`, and it falls back to Convex internally if Upstash is down, so
  // the client sees one endpoint with a defined contract:
  //   204            -> the snapshot is still `knownVersion`, do nothing
  //   200 + payload  -> apply it
  //   anything else  -> unhealthy, fall back to Convex below
  const CATALOGUE_ENDPOINT = '/api/catalogue'

  // The catalogue only changes every ~3 days (Drive sync) or on a rare
  // moderation approval, and the snapshot refreshes within 15 min of a write.
  // Polling every 30s was pure waste; 10 min still feels instant to a user.
  const POLL_MS = 10 * 60 * 1000

  interface SnapshotPayload {
    generatedAt: number
    // `parents` is stripped server-side (dead weight) but `Paper` is typed as
    // the full CatalogueItem, so it is re-added as empty on hydration.
    papers: Array<Omit<Paper, 'parents'> & { parents?: string[] }>
    metrics: MetricRow[]
    trends: Array<{ term: string; score: number }>
  }

  type SnapshotResult =
    | { status: 'unchanged' }
    | { status: 'updated'; version: number; payload: SnapshotPayload }

  let snapshotVersion = 0
  // null = not yet tested, true = healthy, false = using the Convex fallback.
  let endpointHealthy: boolean | null = null
  let consecutiveFailures = 0
  let pollCount = 0

  async function fetchSnapshot(knownVersion: number): Promise<SnapshotResult> {
    const url =
      knownVersion > 0
        ? `${CATALOGUE_ENDPOINT}?v=${knownVersion}`
        : CATALOGUE_ENDPOINT
    const res = await fetch(url, { headers: { accept: 'application/json' } })

    if (res.status === 204) return { status: 'unchanged' }
    if (!res.ok) throw new Error(`catalogue endpoint responded ${res.status}`)

    const version = Number(res.headers.get('x-snapshot-version') ?? 0)
    const payload = (await res.json()) as SnapshotPayload
    if (!Array.isArray(payload.papers)) {
      throw new Error('catalogue endpoint returned a malformed payload')
    }
    return { status: 'updated', version, payload }
  }

  function hydratePapers(list: SnapshotPayload['papers']): Paper[] {
    return list.map((p) => ({ ...p, parents: p.parents ?? [] }))
  }

  /**
   * The pre-Redisky path, kept intact as a fallback. Reads the three legacy
   * full-collect queries — expensive, which is exactly why this is now the
   * exception rather than the rule.
   */
  async function loadFromConvex(): Promise<boolean> {
    try {
      const itemsP = convex.query(api.catalogue.get, {})
      const metricsP = fetchMetrics()
      const trendsP = convex.query(api.trends.getTop, {})

      const [items, metricRows, trendRows] = await Promise.all([itemsP, metricsP, trendsP])

      apply(items, metricRows)
      searchTrends.value = Object.fromEntries(trendRows.map((t) => [t.term, t.score]))
      loaded.value = true
      loading.value = false
      flushCache(true)
      return true
    } catch (e) {
      captureAppException(e, { fn: 'loadFromConvex' })
      error.value = e instanceof Error ? e.message : 'Failed to load the library'
      loading.value = false
      return false
    }
  }

  /**
   * One poll cycle. Prefers the snapshot endpoint; falls back to Convex when it
   * is unhealthy, retrying the endpoint on a widening interval (every 2nd, 4th,
   * 8th, 16th poll) so a prolonged outage does not turn into a request flood
   * while still recovering on its own.
   */
  async function pull(force = false): Promise<void> {
    if (!force && document.hidden) return
    pollCount++

    if (endpointHealthy === false && !force) {
      const retryEvery = 1 << Math.min(consecutiveFailures, 4)
      if (pollCount % retryEvery !== 0) {
        await loadFromConvex()
        return
      }
    }

    try {
      const result = await fetchSnapshot(snapshotVersion)
      if (endpointHealthy === false) {
        captureAppMessage('Catalogue endpoint recovered; back on the Redis read path.', 'info')
      }
      endpointHealthy = true
      consecutiveFailures = 0
      if (result.status === 'unchanged') return

      snapshotVersion = result.version
      apply(hydratePapers(result.payload.papers), result.payload.metrics)
      searchTrends.value = Object.fromEntries(
        result.payload.trends.map((t) => [t.term, t.score]),
      )
      error.value = null
      loaded.value = true
      loading.value = false
      flushCache(true)
    } catch (e) {
      const wasHealthy = endpointHealthy
      endpointHealthy = false
      consecutiveFailures++
      // Report only the healthy -> unhealthy transition. Reporting every failed
      // poll would turn a 10-minute cadence into 144 events a day per tab.
      if (wasHealthy !== false) {
        captureAppException(e, { fn: 'fetchSnapshot', consecutiveFailures })
      }
      await loadFromConvex()
    }
  }

  // ---------- loading ----------
  // Async + progressive: resolve `load()` as soon as paint-ready state exists,
  // never blocking the UI on the full catalogue round-trip.
  let started = false

  async function load(): Promise<void> {
    if (loaded.value || started) return
    started = true
    loading.value = true

    // Paint immediately from the local cache while the network fetch runs.
    hydrateFromCache()
    error.value = null

    const ok = await (async () => {
      try {
        const result = await fetchSnapshot(snapshotVersion)
        endpointHealthy = true
        if (result.status === 'updated') {
          snapshotVersion = result.version
          apply(hydratePapers(result.payload.papers), result.payload.metrics)
          searchTrends.value = Object.fromEntries(
            result.payload.trends.map((t) => [t.term, t.score]),
          )
        }
        loaded.value = true
        loading.value = false
        flushCache(true)
        return true
      } catch {
        // Expected under `vite dev` (there is no Vercel function) — not worth
        // an error report, and the Convex path below handles it. Deliberately
        // not reported: in dev this is the normal path, not a fault.
        endpointHealthy = false
        return loadFromConvex()
      }
    })()

    if (ok) startAutoRefresh()
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
    cacheDirty = true
    try {
      await convex.mutation(api.metrics.bump, { paper_id: id, kind, delta })
    } catch (e) {
      captureAppException(e, { fn: 'recordMetric', kind })
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
      captureAppException(e, { fn: 'recordSearch' })
    }
  }

  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let visibilityBound = false

  /**
   * Manual/external refresh. Cheap no-op when the snapshot has not moved, which
   * is the common case: an unchanged poll transfers ~30 bytes and re-runs none
   * of the derived-list work below.
   */
  async function refresh(): Promise<void> {
    if (!loaded.value || loading.value) return
    await pull(true)
  }

  function handleVisibilityChange(): void {
    if (document.hidden) {
      // Persist anything the throttle has been holding before the tab sleeps.
      flushCache(true)
      return
    }
    // Coming back to a backgrounded tab: check immediately rather than making
    // the user stare at a stale library until the next tick.
    if (loaded.value) void pull(true)
  }

  function startAutoRefresh(): void {
    if (!refreshTimer) {
      refreshTimer = setInterval(() => void pull(), POLL_MS)
    }
    if (!visibilityBound) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      visibilityBound = true
    }
  }

  function stopAutoRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    if (visibilityBound) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      visibilityBound = false
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