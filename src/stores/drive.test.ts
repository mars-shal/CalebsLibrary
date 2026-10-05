// Tests for the paged catalogue read path in the store (src/stores/drive.ts).
//
// Paging introduces a failure mode the old whole-catalogue download could not
// have: a partial list that is mistaken for the whole library. If that happens
// the app does not throw — it quietly shows the wrong thing, and persists the
// wrong thing for the next visit. So these tests assert the invariants:
//
//   1. the first load asks for a page, not the whole catalogue
//   2. a partial load is never written to localStorage under the snapshot's
//      version (which would make the next visit probe `?v=`, get "unchanged",
//      and sit on the partial list forever)
//   3. `fetchMore` walks forward and merges without duplicating
//   4. `ensureComplete` gets everything, and only then does the cache open
//   5. the headline totals describe the library, not the loaded page
//
// localStorage, fetch and the Convex client are all stubbed; no network here.

import { describe, expect, test, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { convexQuery, convexMutation } = vi.hoisted(() => ({
  convexQuery: vi.fn(),
  convexMutation: vi.fn(async () => null),
}))

vi.mock('@/script/convex', () => ({
  convex: { query: convexQuery, mutation: convexMutation },
  api: { catalogue: { get: 'catalogue.get' }, metrics: { bump: 'metrics.bump' }, trends: { getTop: 'trends.getTop', record: 'trends.record' } },
}))

vi.mock('@/script/sentry', () => ({
  captureAppException: vi.fn(),
  captureAppMessage: vi.fn(),
}))

const PAGE_SIZE = 60

/** A catalogue of `n` papers, newest last, mirroring the endpoint's wire shape. */
function makePapers(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    title: `Paper ${i}`,
    subtitle: '',
    subject: i % 2 === 0 ? 'maths' : 'cs',
    subjectName: i % 2 === 0 ? 'Mathematics' : 'Computer Science',
    course: `C${i % 2 === 0 ? 'MATH' : 'CS'}${100 + (i % 20)}`,
    courseName: `${i % 2 === 0 ? 'MATH' : 'CS'} 10${i % 9} — Topic ${i % 7}`,
    type: 'notes',
    year: 2024,
    pages: 10,
    upvotes: 0,
    downvotes: 0,
    downloads: 0,
    views: 100,
    contributor: `user${i % 4}@example.com`,
    contributorName: `User ${i % 4}`,
    teacher: 'Dr Test',
    cover: 0,
    mimeType: 'application/pdf',
    fileExt: 'pdf',
    sizeLabel: '1 MB',
    previewUrl: `https://example.com/p${i}/preview`,
    downloadUrl: `https://example.com/p${i}/download`,
    fileId: `p${i}`,
    createdAt: new Date(1_700_000_000_000 + i * 60_000).toISOString(),
    college: 'Engineering',
    program: 'cs',
    level: '100',
    levelYear: '1',
    semester: 'term1',
    deptSection: 'A',
    license: 'CC BY-SA 4.0',
  }))
}

const ALL = makePapers(125)

function summary(papers: Array<{ subject?: string }>) {
  const bySubject = new Map<string, number>()
  for (const p of papers) {
    const id = p.subject ?? 'general'
    bySubject.set(id, (bySubject.get(id) ?? 0) + 1)
  }
  return {
    papers: papers.length,
    contributors: 4,
    reads: 1250,
    subjects: [...bySubject.entries()]
      .map(([id, count]) => ({ id, name: id, code: '', count }))
      .sort((a, b) => b.count - a.count),
  }
}

interface FetchCall {
  url: string
  limit: number
  offset: number
  v: number
}

const calls: FetchCall[] = []

/**
 * Serve `/api/catalogue` the way the endpoint does: newest-first slices, the
 * whole-catalogue total in a header, and `summary` describing all of it.
 */
function stubEndpoint(total = ALL.length) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = new URL(String(input), 'http://localhost')
      const limit = Number(url.searchParams.get('limit') ?? 0)
      const offset = Number(url.searchParams.get('offset') ?? 0)
      calls.push({
        url: String(input),
        limit,
        offset,
        v: Number(url.searchParams.get('v') ?? 0),
      })

      const newestFirst = [...ALL].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const page = limit > 0 ? newestFirst.slice(offset, offset + limit) : newestFirst
      return {
        ok: true,
        status: 200,
        headers: {
          get: (k: string) =>
            k.toLowerCase() === 'x-snapshot-version'
              ? '9'
              : k.toLowerCase() === 'x-catalogue-total'
                ? String(total)
                : null,
        },
        json: async () => ({
          version: 9,
          generatedAt: 1,
          papers: page,
          metrics: [],
          trends: [],
          summary: summary(ALL.slice(0, total)),
        }),
      }
    }),
  )
}

async function makeStore() {
  const { useDriveStore } = await import('@/stores/drive')
  setActivePinia(createPinia())
  return useDriveStore()
}

const storage: Record<string, string> = {}

/** In-memory localStorage; the store reads and writes it synchronously. */
const localStorageMock = {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => {
    storage[k] = v
  },
  removeItem: (k: string) => {
    delete storage[k]
  },
  clear: () => {
    for (const k of Object.keys(storage)) delete storage[k]
  },
}

beforeEach(() => {
  calls.length = 0
  localStorageMock.clear()
  // jsdom is not the default environment here, so neither localStorage nor
  // document exists by default — the store needs both.
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('document', {
    hidden: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
  stubEndpoint()
})

describe('first load', () => {
  test('asks for a page rather than the whole catalogue', async () => {
    const drive = await makeStore()
    await drive.load()

    expect(calls).toHaveLength(1)
    expect(calls[0]?.limit).toBe(5)
    expect(drive.papers).toHaveLength(5)
    expect(drive.complete).toBe(false)
  })

  test('a page is not mistaken for the whole library', async () => {
    const drive = await makeStore()
    await drive.load()

    expect(drive.total).toBe(125)
    // The stats must describe the library, not the five papers on screen.
    expect(drive.stats.papers).toBe(125)
    expect(drive.statsKnown).toBe(true)
    // ...and the store must know it does not have everything yet.
    expect(drive.complete).toBe(false)
  })

  test('a cached catalogue is reused instead of re-downloaded', async () => {
    const first = await makeStore()
    await first.load()
    await first.ensureComplete()
    expect(localStorageMock.getItem('bellsnotesCatalogueCache')).toBeTruthy()

    // A fresh store (new tab) hydrates from the cache and then sends the cheap
    // version probe, which answers 204 — so nothing but a few bytes crosses the
    // wire even though the catalogue is cached under version 9.
    calls.length = 0
    stubEndpointUnchanged()
    const second = await makeStore()
    await second.load()

    expect(second.papers.length).toBe(125)
    expect(second.complete).toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.v).toBe(9)
    expect(calls[0]?.limit).toBe(0)
  })
})

describe('cache safety', () => {
  test('a partial load is never persisted', async () => {
    const drive = await makeStore()
    await drive.load()

    // The whole catalogue is in memory after five papers; writing it here would
    // make the next visit believe it had the library.
    expect(localStorageMock.getItem('bellsnotesCatalogueCache')).toBeNull()
  })

  test('partial pages never overwrite a good cache', async () => {
    const drive = await makeStore()
    await drive.load()
    await drive.ensureComplete()
    const good = localStorageMock.getItem('bellsnotesCatalogueCache')
    expect(good).toBeTruthy()

    // Scroll further after completing: still one catalogue's worth, and the
    // cache is not corrupted by a page-scoped write.
    await drive.fetchMore()
    expect(localStorageMock.getItem('bellsnotesCatalogueCache')).toBe(good)
  })
})

describe('fetchMore', () => {
  test('appends the next page without duplicating', async () => {
    const drive = await makeStore()
    await drive.load()
    expect(drive.papers).toHaveLength(5)

    await drive.fetchMore()
    expect(drive.papers).toHaveLength(5 + PAGE_SIZE)
    expect(new Set(drive.papers.map((p) => p.id)).size).toBe(5 + PAGE_SIZE)
    // The next page is asked for at the offset already held.
    expect(calls[1]?.offset).toBe(5)
  })

  test('keeps paging until the catalogue is complete', async () => {
    const drive = await makeStore()
    await drive.load()

    for (let i = 0; i < 10 && !drive.complete; i++) await drive.fetchMore()

    expect(drive.complete).toBe(true)
    expect(drive.papers).toHaveLength(125)
  })

  test('a completed catalogue stops asking', async () => {
    const drive = await makeStore()
    await drive.load()
    await drive.ensureComplete()
    calls.length = 0

    await drive.fetchMore()
    await drive.fetchMore()
    expect(calls).toHaveLength(0)
  })

  test('never asks with a version probe', async () => {
    // `?v=<known>` on a page request would 204 and paging would stop dead,
    // because the endpoint treats "unchanged" as "you have everything".
    const drive = await makeStore()
    await drive.load()
    await drive.fetchMore()
    for (const c of calls) expect(c.v).toBe(0)
  })
})

describe('ensureComplete', () => {
  test('fetches the whole catalogue and opens the cache', async () => {
    const drive = await makeStore()
    await drive.load()
    await drive.ensureComplete()

    expect(drive.papers).toHaveLength(125)
    expect(drive.complete).toBe(true)
    expect(localStorageMock.getItem('bellsnotesCatalogueCache')).toBeTruthy()
    // Unpaged, so the endpoint's version probe still works.
    expect(calls[calls.length - 1]?.limit).toBe(0)
  })

  test('is a no-op once complete', async () => {
    const drive = await makeStore()
    await drive.load()
    await drive.ensureComplete()
    calls.length = 0

    await drive.ensureComplete()
    expect(calls).toHaveLength(0)
  })
})

describe('derived values', () => {
  test('the subject list covers the whole catalogue, not the loaded page', async () => {
    const drive = await makeStore()
    await drive.load()

    // Five newest papers would otherwise yield one or two subjects; the home
    // page's "All N subjects" and the trending tags both read this.
    expect(drive.subjects.map((s) => s.id).sort()).toEqual(['cs', 'maths'])
  })

  test('stats are unavailable rather than wrong on an old snapshot', async () => {
    // A snapshot predating `summary`: without it the only numbers available are
    // the page's, so the caller must keep its placeholder instead of showing
    // "5 Papers".
    stubEndpointNoSummary()
    const drive = await makeStore()
    await drive.load()

    expect(drive.statsKnown).toBe(false)
    expect(drive.complete).toBe(false)
  })
})

/** Serve 204 for the version probe, as an unchanged snapshot does. */
function stubEndpointUnchanged() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = new URL(String(input), 'http://localhost')
      calls.push({
        url: String(input),
        limit: Number(url.searchParams.get('limit') ?? 0),
        offset: Number(url.searchParams.get('offset') ?? 0),
        v: Number(url.searchParams.get('v') ?? 0),
      })
      return { ok: true, status: 204, headers: { get: () => null }, json: async () => null }
    }),
  )
}

/** Serve a snapshot with no `summary`, as built before paging shipped. */
function stubEndpointNoSummary() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = new URL(String(input), 'http://localhost')
      const limit = Number(url.searchParams.get('limit') ?? 0)
      const offset = Number(url.searchParams.get('offset') ?? 0)
      calls.push({
        url: String(input),
        limit,
        offset,
        v: Number(url.searchParams.get('v') ?? 0),
      })
      const newestFirst = [...ALL].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const page = limit > 0 ? newestFirst.slice(offset, offset + limit) : newestFirst
      return {
        ok: true,
        status: 200,
        headers: {
          get: (k: string) =>
            k.toLowerCase() === 'x-snapshot-version'
              ? '9'
              : k.toLowerCase() === 'x-catalogue-total'
                ? '125'
                : null,
        },
        json: async () => ({ version: 9, generatedAt: 1, papers: page, metrics: [], trends: [] }),
      }
    }),
  )
}