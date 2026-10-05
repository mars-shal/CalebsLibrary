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
  buildSummary,
  type CatalogueSummary,
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

  // ---- paged catalogue state ----
  // `papers` holds a newest-first *prefix* of the catalogue, not always all of
  // it. The home page draws five papers; browse pages in more as you scroll;
  // search and the drill-downs ask for the whole thing when they need it.
  //   total    -> how many papers exist, so we know whether more remain
  //   complete -> true when `papers` holds every one of them
  // `complete` is load-bearing, not informational: it gates the localStorage
  // write, because persisting a partial list under the full catalogue's version
  // would make the next visit probe `?v=` , get "unchanged", and sit on that
  // partial list forever with nothing logged to say why.
  const total = ref(0)
  const complete = ref(false)
  const fetchingMore = ref(false)
  const completing = ref(false)
  let morePending = false

  // Catalogue-wide totals from the server, present from the first response and
  // independent of how many papers are actually loaded. This is what keeps the
  // home page honest: "1,249 Papers" rather than "5 Papers".
  const summary = ref<CatalogueSummary | null>(null)

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

  const stats = computed(() => {
    // Prefer the server's whole-catalogue totals. Deriving from `papers` is only
    // right once every paper is loaded, and after paging that is the exception
    // (search, a subject drill-down), not the default. Older snapshots predate
    // `summary`, so fall back to counting what we hold.
    const s = summary.value
    return {
      papers: s ? s.papers : papers.value.length,
      contributors: s
        ? s.contributors
        : new Set(papers.value.map((p) => p.contributor)).size,
      reads: s ? s.reads : Math.round(papers.value.reduce((sum, p) => sum + p.views, 0) / 12),
      subjects: s ? s.subjects.length : subjects.value.length,
    }
  })

  /**
   * Whether those totals describe the whole library.
   *
   * A snapshot built before paging ships no `summary`, so until the catalogue is
   * fully loaded the only numbers available are those of the loaded page — and
   * rendering "5 Papers" for a library of 1,255 is worse than showing nothing.
   * Callers should hold their placeholder until this is true.
   */
  const statsKnown = computed(() => summary.value !== null || complete.value)

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
    // Never persist a partial catalogue. See the note on `complete`.
    if (!complete.value) return
    if (!force && Date.now() - lastCacheWrite < CACHE_WRITE_MIN_INTERVAL_MS) return
    writeCache(snapshotVersion)
    cacheDirty = false
    lastCacheWrite = Date.now()
  }

  function apply(paperList: Paper[], metricRows: MetricRow[], incomingSummary?: CatalogueSummary | null): void {
    applyMetrics(paperList, metricRows)
    ownerList.value = deriveOwners(paperList)
    setContributors(contributors.value)
    papers.value = paperList
    courses.value = computeCourses(paperList)
    if (incomingSummary) summary.value = incomingSummary
    subjects.value = subjectsFromLoaded(paperList, courses.value, summary.value)
    cacheDirty = true
  }

  /**
   * The subject list for the subject picker, the browse shelves and the home
   * page's "All N subjects" link.
   *
   * Once the catalogue is complete these are just the local grouping. While it is
   * still paged, grouping whatever happens to be loaded would advertise three
   * subjects for a library that has nine — so the server's whole-catalogue counts
   * are used instead. `courses` stays empty in that case, which is fine: nothing
   * that reads a subject's courses is reachable without the full catalogue
   * (subject pages call `ensureComplete`).
   */
  function subjectsFromLoaded(
    loaded: Paper[],
    loadedCourses: Course[],
    totals: CatalogueSummary | null,
  ): Subject[] {
    if (loaded.length >= total.value && total.value > 0) return computeSubjects(loadedCourses)
    if (!totals) return computeSubjects(loadedCourses)
    return totals.subjects.map((s) => ({ ...s, courses: [] }))
  }

  // Hydrate from localStorage so the first paint is instant (no network wait).
  // The network fetch then replaces it in the background.
  //
  // Only ever called with a cache that was written while complete, so this is
  // always the whole catalogue — which is what makes the fast path for a
  // returning visitor possible at all.
  function hydrateFromCache(): boolean {
    const cache = readCache()
    if (!cache?.papers?.length) return false
    snapshotVersion = cache.snapshotVersion ?? 0
    papers.value = cache.papers
    courses.value = cache.courses
    subjects.value = cache.subjects
    ownerList.value = cache.owners
    setContributors(contributors.value)
    total.value = cache.papers.length
    complete.value = true
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
    // Catalogue-wide totals, computed server-side over every paper. Absent in
    // snapshots built before paging shipped, so treat it as optional and fall
    // back to deriving from whatever is loaded.
    summary?: CatalogueSummary
    /** Set by the endpoint when this response is one page of several. */
    paged?: boolean
  }

  type SnapshotResult =
    | { status: 'unchanged' }
    | { status: 'updated'; version: number; payload: SnapshotPayload; total: number }

  // One page of papers. `limit = 0` asks for the whole catalogue, which is what
  // search and the drill-downs use.
  const PAGE_SIZE = 60
  // What the home page draws. This is the default for `load()` because the app
  // shell loads the store before any route is known, and five papers is the
  // smallest useful answer: it is what the landing page renders, so the common
  // case never asks for more.
  const HOME_PAGE = 5

  async function fetchSnapshot(
    knownVersion: number,
    limit = 0,
    offset = 0,
  ): Promise<SnapshotResult> {
    const params = new URLSearchParams()
    if (knownVersion > 0) params.set('v', String(knownVersion))
    if (limit > 0) {
      params.set('limit', String(limit))
      params.set('offset', String(offset))
    }
    const qs = params.toString()
    const url = qs ? `${CATALOGUE_ENDPOINT}?${qs}` : CATALOGUE_ENDPOINT
    const res = await fetch(url, { headers: { accept: 'application/json' } })

    if (res.status === 204) return { status: 'unchanged' }
    if (!res.ok) throw new Error(`catalogue endpoint responded ${res.status}`)

    const version = Number(res.headers.get('x-snapshot-version') ?? 0)
    const totalPapers = Number(res.headers.get('x-catalogue-total') ?? 0)
    const payload = (await res.json()) as SnapshotPayload
    if (!Array.isArray(payload.papers)) {
      throw new Error('catalogue endpoint returned a malformed payload')
    }
    return { status: 'updated', version, payload, total: totalPapers }
  }

  function hydratePapers(list: SnapshotPayload['papers']): Paper[] {
    return list.map((p) => ({ ...p, parents: p.parents ?? [] }))
  }

  /** Did this response give us every paper in the catalogue? */
  function coversEverything(got: number, totalPapers: number): boolean {
    return totalPapers > 0 ? got >= totalPapers : false
  }

  // null = not yet tested, true = healthy, false = using the Convex fallback.
  let snapshotVersion = 0
  let endpointHealthy: boolean | null = null
  let consecutiveFailures = 0
  let pollCount = 0

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

      apply(items, metricRows, buildSummary(items))
      searchTrends.value = Object.fromEntries(trendRows.map((t) => [t.term, t.score]))
      // The Convex fallback is a full collect — it has no paging — so the store
      // is complete after it runs.
      total.value = items.length
      complete.value = true
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
      // A paged store polls for the same window it already holds, so a paper
      // added since the last tick appears at the top without discarding what
      // the reader has scrolled to. A complete store keeps the old cheap
      // whole-catalogue probe.
      const paged = !complete.value
      const window = paged ? Math.min(Math.max(papers.value.length, 1), 300) : 0
      const result = await fetchSnapshot(snapshotVersion, window)
      if (endpointHealthy === false) {
        captureAppMessage('Catalogue endpoint recovered; back on the Redis read path.', 'info')
      }
      endpointHealthy = true
      consecutiveFailures = 0
      if (result.status === 'unchanged') return

      snapshotVersion = result.version
      const hydrated = hydratePapers(result.payload.papers)
      if (paged) {
        // Merge rather than replace: keep what is on screen, prepend anything
        // genuinely new so newest-first ordering still holds.
        const seen = new Set(papers.value.map((p) => p.id))
        const fresh = hydrated.filter((p) => !seen.has(p.id))
        if (fresh.length === 0) return
        apply([...fresh, ...papers.value], result.payload.metrics, result.payload.summary)
        if (result.total > 0) total.value = result.total
      } else {
        total.value = result.total || hydrated.length
        apply(hydrated, result.payload.metrics, result.payload.summary)
        complete.value = coversEverything(hydrated.length, total.value)
      }
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

  /**
   * First load. `limit` is how many papers the calling view is about to draw —
   * the home page's five by default, and 0 for anything that needs the whole
   * corpus.
   *
   * A returning visitor with a cached catalogue keeps it: the cache is always
   * complete, and the version probe answers 204 without shipping anything.
   */
  async function load(limit = HOME_PAGE): Promise<void> {
    if (loaded.value || started) return
    started = true
    loading.value = true

    // Paint immediately from the local cache while the network fetch runs.
    const fromCache = hydrateFromCache()
    error.value = null

    const ok = await (async () => {
      try {
        const result = await fetchSnapshot(snapshotVersion, fromCache ? 0 : limit)
        endpointHealthy = true
        if (result.status === 'updated') {
          snapshotVersion = result.version
          const hydrated = hydratePapers(result.payload.papers)
          total.value = result.total || hydrated.length
          apply(hydrated, result.payload.metrics, result.payload.summary)
          complete.value = coversEverything(hydrated.length, total.value)
          searchTrends.value = Object.fromEntries(
            result.payload.trends.map((t) => [t.term, t.score]),
          )
        } else {
          // "Unchanged" — the cache we hydrated from is still authoritative.
          complete.value = fromCache
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

  /**
   * Append the next page. Called from the scroll sentinel in browse, so the
   * catalogue arrives a screenful at a time instead of all at once.
   *
   * No version probe here on purpose: a 204 would mean "your copy is current",
   * which is true of the prefix we hold but is not what we asked for — we asked
   * for a page we have never seen.
   */
  async function fetchMore(): Promise<void> {
    if (complete.value || morePending || loading.value) return
    if (total.value > 0 && papers.value.length >= total.value) {
      complete.value = true
      return
    }
    morePending = true
    fetchingMore.value = true
    try {
      const result = await fetchSnapshot(0, PAGE_SIZE, papers.value.length)
      if (result.status === 'updated') {
        const incoming = hydratePapers(result.payload.papers)
        if (incoming.length === 0) {
          // Nothing left to hand back — treat the catalogue as exhausted rather
          // than letting the sentinel spin on an endpoint that keeps agreeing.
          complete.value = true
        } else {
          apply([...papers.value, ...incoming], result.payload.metrics, result.payload.summary)
          if (result.total > 0) total.value = result.total
          complete.value = coversEverything(papers.value.length, total.value)
        }
      }
    } catch (e) {
      // Leave what we have; the sentinel will ask again on the next scroll.
      captureAppException(e, { fn: 'fetchMore' })
    } finally {
      morePending = false
      fetchingMore.value = false
    }
  }

  /**
   * Fetch the entire catalogue. Search and the subject/profile drill-downs
   * filter across every paper, so they cannot answer from a prefix. This is the
   * deliberate full download — it happens when someone actually searches, not
   * on the way to the home page.
   */
  async function ensureComplete(): Promise<void> {
    if (complete.value || completing.value) return
    completing.value = true
    try {
      const result = await fetchSnapshot(0)
      if (result.status === 'updated') {
        snapshotVersion = result.version
        const hydrated = hydratePapers(result.payload.papers)
        total.value = result.total || hydrated.length
        apply(hydrated, result.payload.metrics, result.payload.summary)
        complete.value = true
        searchTrends.value = Object.fromEntries(
          result.payload.trends.map((t) => [t.term, t.score]),
        )
        flushCache(true)
      } else {
        complete.value = true
      }
    } catch (e) {
      captureAppException(e, { fn: 'ensureComplete' })
    } finally {
      completing.value = false
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
    total,
    complete,
    statsKnown,
    fetchingMore,
    completing,
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
    fetchMore,
    ensureComplete,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    recordMetric,
    recordSearch,
  }
})

export type DriveStore = ReturnType<typeof useDriveStore>