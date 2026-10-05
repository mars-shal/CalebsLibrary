// Tests for the catalogue endpoint's paging, ordering and compression contract
// (api/catalogue.ts).
//
// These are the properties that, if they broke, would not throw — they would
// quietly show the wrong papers or the wrong library size:
//
//   1. a page is newest-first, because the client appends pages in the order it
//      receives them
//   2. `X-Catalogue-Total` reports the size of the whole catalogue, so a paged
//      client can tell a partial page from a complete one
//   3. `createdAt` sorts correctly whether it arrives as an ISO string or a
//      numeric timestamp
//   4. one page's compressed bytes are never served for another page
//   5. a paged request is not answered 204/304 by a whole-catalogue match
//
// Redis is stubbed at the module boundary, so nothing here touches the network.

import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { brotliDecompressSync, gunzipSync } from 'node:zlib'

// `vi.mock` factories are hoisted above ordinary declarations, so the stub has to
// be hoisted with them or the factory closes over an uninitialised binding and
// every call returns undefined.
const { redisGet } = vi.hoisted(() => ({ redisGet: vi.fn() }))

vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = redisGet
  },
}))

const NOW = 1_700_000_000_000

function paper(id: string, createdAt: string, subject = 'maths') {
  return {
    id,
    title: `Paper ${id}`,
    subject,
    subjectName: 'Mathematics',
    course: 'MATH101',
    courseName: 'MATH 101 — Calculus',
    contributor: 'test@example.com',
    views: 100,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    previewUrl: `https://drive.google.com/file/d/${id}/preview`,
    fileId: id,
    createdAt,
  }
}

/** Oldest to newest, so a correct newest-first sort is a real reversal. */
const PAPERS = [
  paper('p1', new Date(NOW - 3000).toISOString()),
  paper('p2', new Date(NOW - 2000).toISOString(), 'cs'),
  paper('p3', new Date(NOW - 1000).toISOString()),
  paper('p4', new Date(NOW).toISOString(), 'cs'),
  paper('p5', new Date(NOW - 4000).toISOString()),
]

const SNAPSHOT = JSON.stringify({
  version: 7,
  generatedAt: NOW,
  papers: PAPERS,
  metrics: [],
  trends: [],
  summary: { papers: 5, contributors: 1, reads: 42, subjects: [] },
})

interface Captured {
  /** Deliberately not `status` — that name is Vercel's `status(code)` method. */
  statusCode: number
  headers: Record<string, string>
  raw: Buffer
}

/** The parts of the endpoint's response these tests read. */
interface ApiPayload {
  papers: Array<{ id: string; subject?: string }>
  summary?: { papers: number; contributors: number; reads: number }
  [key: string]: unknown
}

/** Minimal VercelResponse surface: collect instead of write. */
function fakeRes(): VercelResponse & Captured {
  const state: Captured = { statusCode: 200, headers: {}, raw: Buffer.alloc(0) }
  const res = {
    status(code: number) {
      state.statusCode = code
      return res as unknown as VercelResponse
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      state.headers[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value)
      return res as unknown as VercelResponse
    },
    send(body: unknown) {
      // Compressed responses arrive as a Buffer; JSON.stringify on one would turn
      // the bytes into base64 text and corrupt the payload.
      state.raw = Buffer.isBuffer(body)
        ? body
        : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))
      return res as unknown as VercelResponse
    },
    end() {
      return res as unknown as VercelResponse
    },
    json(body: unknown) {
      state.headers['content-type'] = 'application/json'
      state.raw = Buffer.from(JSON.stringify(body))
      return res as unknown as VercelResponse
    },
  }
  // Exposed as getters: the endpoint mutates `state` through the response
  // object, so a copied snapshot of it would still read the initial 200/empty.
  return Object.defineProperties(res as unknown as VercelResponse, {
    statusCode: { get: () => state.statusCode, enumerable: true },
    headers: { get: () => state.headers, enumerable: true },
    raw: { get: () => state.raw, enumerable: true },
  }) as VercelResponse & Captured
}

async function setup() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://stub.upstash.io')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'stub-token')
  redisGet.mockImplementation(async (key: string) => (key === 'cl:ver' ? '7' : SNAPSHOT))
  const { default: handler } = await loadHandler()

  return {
    async get(path: string, headers: Record<string, string> = {}) {
      const url = new URL(path, 'http://localhost')
      const query: Record<string, string> = {}
      url.searchParams.forEach((v, k) => {
        query[k] = v
      })
      const vreq = {
        method: 'GET',
        url: path,
        query,
        headers: { ...headers },
      } as unknown as VercelRequest
      const res = fakeRes()
      await handler(vreq, res)

      const raw = res.raw
      const enc = res.headers['content-encoding']
      const text =
        enc === 'br'
          ? brotliDecompressSync(raw).toString('utf8')
          : enc === 'gzip'
            ? gunzipSync(raw).toString('utf8')
            : raw.toString('utf8')

      return {
        status: res.statusCode,
        headers: new Headers(res.headers),
        raw,
        text,
        // Every request in this file expects a JSON body; a 204/304 has none and
        // its tests assert on `status` and `text` instead.
        body: (text ? JSON.parse(text) : { papers: [] }) as ApiPayload,
      }
    },
    async close() {
      /* nothing to tear down */
    },
  }
}

let harness: Awaited<ReturnType<typeof setup>>

beforeEach(async () => {
  harness = await setup()
})

afterEach(async () => {
  await harness.close()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('paging', () => {
  test('a page is newest-first', async () => {
    const { body } = await harness.get('/api/catalogue?limit=5')
    expect(body.papers.map((p: { id: string }) => p.id)).toEqual(['p4', 'p3', 'p2', 'p1', 'p5'])
  })

  test('offset walks forward through the same order without gaps or repeats', async () => {
    const first = await harness.get('/api/catalogue?limit=2')
    const second = await harness.get('/api/catalogue?limit=2&offset=2')
    const rest = await harness.get('/api/catalogue?limit=2&offset=4')

    const ids = [
      ...first.body.papers,
      ...second.body.papers,
      ...rest.body.papers,
    ].map((p: { id: string }) => p.id)

    expect(ids).toEqual(['p4', 'p3', 'p2', 'p1', 'p5'])
    expect(new Set(ids).size).toBe(5)
  })

  test('X-Catalogue-Total is the whole catalogue, not the page', async () => {
    const { headers, body } = await harness.get('/api/catalogue?limit=2')
    expect(body.papers).toHaveLength(2)
    expect(headers.get('x-catalogue-total')).toBe('5')
  })

  test('limit is capped so one request cannot ask for everything', async () => {
    const { body } = await harness.get('/api/catalogue?limit=100000')
    expect(body.papers).toHaveLength(5)
  })

  test('nonsense paging parameters fall back to the whole catalogue', async () => {
    for (const q of ['limit=abc', 'limit=-5', 'offset=abc', 'limit=0']) {
      const { body } = await harness.get(`/api/catalogue?${q}`)
      expect(body.papers).toHaveLength(5)
    }
  })

  test('carries the whole-catalogue summary alongside a partial page', async () => {
    // The client reports "5 Papers" on the home page from this, with one paper
    // loaded. It must describe the library, not the page.
    const { body } = await harness.get('/api/catalogue?limit=1')
    expect(body.papers).toHaveLength(1)
    expect(body.summary).toMatchObject({ papers: 5, contributors: 1 })
  })

  test('the version probe stays whole-catalogue', async () => {
    // An unchanged snapshot is a 204 — ~30 bytes instead of the library.
    const res = await harness.get('/api/catalogue?v=7')
    expect(res.status).toBe(204)
    expect(res.text).toBe('')
  })

  test('a paged request is never answered 204 by a matching version', async () => {
    // `fetchMore` deliberately re-requests the window it holds. A 204 here would
    // read as "you have the whole catalogue" and paging would stop dead.
    const { status, body } = await harness.get('/api/catalogue?v=7&limit=2&offset=0')
    expect(status).toBe(200)
    expect(body.papers).toHaveLength(2)
  })
})

describe('createdAt ordering', () => {
  test('numeric timestamps sort the same as ISO strings', async () => {
    redisGet.mockImplementation(async (key: string) =>
      key === 'cl:ver'
        ? '7'
        : JSON.stringify({
            version: 7,
            // The same five moments as numbers rather than ISO strings.
            papers: [
              { id: 'p1', createdAt: NOW - 3000 },
              { id: 'p2', createdAt: NOW - 2000 },
              { id: 'p3', createdAt: NOW - 1000 },
              { id: 'p4', createdAt: NOW },
              { id: 'p5', createdAt: NOW - 4000 },
            ],
            metrics: [],
            trends: [],
          }),
    )

    const { body } = await harness.get('/api/catalogue?limit=5')
    expect(body.papers.map((p: { id: string }) => p.id)).toEqual(['p4', 'p3', 'p2', 'p1', 'p5'])
  })
})

describe('compression', () => {
  test('serves brotli when the client accepts it', async () => {
    const { headers, raw } = await harness.get('/api/catalogue', { 'accept-encoding': 'br, gzip' })
    expect(headers.get('content-encoding')).toBe('br')
    expect(raw.length).toBeLessThan(JSON.stringify(JSON.parse(SNAPSHOT)).length)
  })

  test('serves gzip for a gzip-only client', async () => {
    const { headers } = await harness.get('/api/catalogue', { 'accept-encoding': 'gzip' })
    expect(headers.get('content-encoding')).toBe('gzip')
  })

  test('varies on Accept-Encoding so a cache cannot serve one to the other', async () => {
    const { headers } = await harness.get('/api/catalogue', { 'accept-encoding': 'br' })
    expect(headers.get('vary')).toContain('Accept-Encoding')
  })

  test('each page gets its own bytes, not the first page reused', async () => {
    // The warm-instance cache is keyed by version; if pages shared a key the
    // second request would come back with the first page's papers.
    const first = await harness.get('/api/catalogue?limit=2&offset=0', {
      'accept-encoding': 'br',
    })
    const second = await harness.get('/api/catalogue?limit=2&offset=2', {
      'accept-encoding': 'br',
    })

    expect(first.body.papers.map((p: { id: string }) => p.id)).toEqual(['p4', 'p3'])
    expect(second.body.papers.map((p: { id: string }) => p.id)).toEqual(['p2', 'p1'])
    expect(first.headers.get('etag')).not.toBe(second.headers.get('etag'))
  })

  test('a page conditional GET is matched against that page, not the catalogue', async () => {
    const first = await harness.get('/api/catalogue?limit=2&offset=0')
    const etag = first.headers.get('etag') as string

    const revalidated = await harness.get('/api/catalogue?limit=2&offset=0', {
      'if-none-match': etag,
    })
    expect(revalidated.status).toBe(304)

    // A different page is a different body, so it must not inherit that 304.
    const other = await harness.get('/api/catalogue?limit=2&offset=2', {
      'if-none-match': etag,
    })
    expect(other.status).toBe(200)
    expect(other.body.papers).toHaveLength(2)
  })
})

describe('degradation', () => {
  test('falls back to the Convex query when the snapshot is unavailable', async () => {
    const { restore } = await withConvexStub()
    try {
      // `beforeEach` imported the endpoint before the stub URL existed, and the
      // module reads `VITE_CONVEX_URL` once at import time. Re-import so the
      // fallback points at the stub instead of the real deployment.
      await harness.close()
      harness = await setup()
      // After the re-import, which repopulates the snapshot stub.
      redisGet.mockRejectedValue(new Error('upstash down'))

      const { status, headers, body } = await harness.get('/api/catalogue?limit=1')
      // The stub answers the three Convex reads; the endpoint must page that
      // result rather than handing back the whole thing.
      expect(status).toBe(200)
      expect(body.papers).toHaveLength(1)
      expect(headers.get('x-catalogue-total')).toBe('2')
    } finally {
      restore()
    }
  })
})

/**
 * Fresh module instance per test, because the endpoint reads `VITE_CONVEX_URL`
 * once at module scope and caches it — so the Convex fallback cannot be pointed
 * somewhere new without re-importing.
 */
async function loadHandler() {
  vi.resetModules()
  // `.js` extension for the same node16/nodenext reason as the source file.
  return import('./catalogue.js')
}

/** Answer the three Convex reads the fallback makes, over a two-paper catalogue. */
async function withConvexStub() {
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const { path } = JSON.parse(body || '{}') as { path: string }
      const value =
        path === 'catalogue:get'
          ? [
              paper('c1', new Date(NOW).toISOString()),
              paper('c2', new Date(NOW - 1000).toISOString()),
            ]
          : []
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ value }))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as { port: number }).port
  const original = process.env.VITE_CONVEX_URL
  vi.stubEnv('VITE_CONVEX_URL', `http://127.0.0.1:${port}`)
  return {
    async restore() {
      if (original === undefined) delete process.env.VITE_CONVEX_URL
      else process.env.VITE_CONVEX_URL = original
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}