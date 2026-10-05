// Bells Notes — catalogue read endpoint (Vercel Function).
//
// This is the replacement for the web app calling `catalogue.get`,
// `metrics.getAll` and `trends.getTop` against Convex every 30 seconds. It
// serves the Upstash read model built by convex/snapshot.ts instead, which
// keeps both the database reads and the egress bytes off the Convex Free plan
// (1 GB each, hard-capped).
//
// Contract
//   GET /api/catalogue?meta=1        -> { version, count, generatedAt, sha }
//   GET /api/catalogue                -> the payload, ETag + 304 support
//   GET /api/catalogue?v=<n>         -> 204 if the snapshot is still version n
//   GET /api/catalogue?limit=5&offset=60
//                                    -> one newest-first page, with
//                                       `X-Catalogue-Total` holding the size of
//                                       the whole catalogue so the client can
//                                       tell a partial page from the full one
//
// Responses are Brothli when the client asks for it (see `negotiate`) and always
// carry `Vary: Accept-Encoding`.
//
// Degradation is deliberate and total: if Upstash is unconfigured, empty, or
// erroring, this falls through to the Convex query and the app behaves exactly
// as it did before. Redis is an optimisation here, never a dependency.
//
// The Upstash token is read from the Vercel environment and must never reach
// the client. It is also NOT the same value as the Convex env copy — rotate
// them independently if one is ever exposed.

import { Redis } from '@upstash/redis'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
// Explicit `.js` extension: Vercel type-checks `api/` with node16/nodenext
// module resolution, which rejects extensionless relative imports. TypeScript
// and Vite both resolve it back to the `.ts` source.
import { buildSummary, type SummarisablePaper } from '../src/schema/catalogue.js'

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const CONVEX_URL = process.env.VITE_CONVEX_URL

// Upstash's free tier serves commands from a regional endpoint; 3s is generous
// for a single GET but short enough that a cold cache does not stall a page.
const UPSTASH_TIMEOUT_MS = 3000
const CONVEX_TIMEOUT_MS = 8000

// Vercel brotlis static assets automatically but leaves function responses on
// gzip, so the catalogue was going out at 131 KB when the same JSON brotlis to
// roughly 95 KB. Every current browser sends `br` in Accept-Encoding, and the
// catalogue is by far the largest thing a reader downloads, so it is worth
// compressing here. Quality 5 is the usual web compromise: near-brotli's ratio
// at a fraction of the CPU, and this runs once per snapshot version, not per
// request.
const BROTLI_QUALITY = 5

type Encoding = 'br' | 'gzip'

/** Pick an encoding from Accept-Encoding, defaulting to gzip for anything we
 *  do not recognise. `br` is only usable when the client actually accepts it. */
function negotiate(req: VercelRequest): Encoding {
  const accept = String(req.headers['accept-encoding'] ?? '')
  return /\bbr\b/.test(accept) ? 'br' : 'gzip'
}

/**
 * The @upstash/redis client takes no AbortSignal, so a hung Upstash request
 * would otherwise hold the function open until the platform kills it — and the
 * browser waits the whole time. Racing a timer turns that into an ordinary
 * rejection, which the existing catch turns into a Convex fallback.
 */
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// The payload is a few hundred KB of JSON that compresses ~6x. Compress once
// per snapshot version and hold it in the warm function instance, so repeat
// requests never re-compress. Keyed on version + encoding, which is stable
// until the catalogue actually changes.
const compressedCache = new Map<string, Buffer>()

function compressed(body: string, version: string, encoding: Encoding): Buffer {
  const key = `${version}:${encoding}`
  const hit = compressedCache.get(key)
  if (hit) return hit
  const raw = Buffer.from(body, 'utf8')
  const out =
    encoding === 'br'
      ? brotliCompressSync(raw, {
          params: {
            [constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
          },
        })
      : gzipSync(raw)
  // Only ever two entries per version; drop the rest so a long-lived warm
  // instance cannot accumulate one buffer per snapshot it has ever served.
  if (compressedCache.size > 8) compressedCache.clear()
  compressedCache.set(key, out)
  return out
}

function getRedis(): Redis | null {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null
  return new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
}

function sendJson(res: VercelResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.status(status).send(JSON.stringify(body))
}

/**
 * Content hash -> a small integer the client can use as a version. Used for the
 * Convex fallback path so `?v=N` still answers 304-style even when Redis is not
 * in play: `catalogue:get` is a full collect either way, so hashing it costs
 * nothing relative to what was just spent.
 */
function hashToVersion(body: string): number {
  // 32 bits of SHA-1 — plenty to detect a catalogue change, and safely inside
  // Number.MAX_SAFE_INTEGER.
  return parseInt(createHash('sha1').update(body).digest('hex').slice(0, 8), 16)
}

/**
 * Last-resort read straight from Convex. This is the old behaviour, kept as a
 * fallback so a Redis outage degrades performance rather than availability.
 *
 * `mode: 'meta'` answers a version probe without shipping the catalogue — the
 * probe must stay cheap or the client has no reason to use it.
 */
/**
 * Paging.
 *
 * The catalogue is ~1,250 papers / 1.3 MB of JSON, and the home page renders
 * five of them. Serving all of it to render five cards put the whole download on
 * the critical path to LCP. `?limit` returns only the newest N papers, so each
 * page asks for what it is about to draw and scrolling asks for more.
 *
 * `limit=0` (absent) means "everything", which is what search and the
 * drill-downs want — so the unpaged behaviour is unchanged.
 */
const MAX_PAGE = 300

function paging(req: VercelRequest): { limit: number; offset: number } {
  const rawLimit = Number(req.query.limit ?? 0)
  const rawOffset = Number(req.query.offset ?? 0)
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), MAX_PAGE) : 0
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0
  return { limit, offset }
}

/** `createdAt` reaches us as a Convex timestamp number but serialises to an ISO
 *  string, so normalise both. Without this `Number()` yields NaN for the ISO
 *  form and the comparator silently degrades to "everything ties" — which
 *  quietly breaks newest-first paging. */
function timeOf(paper: Record<string, unknown>): number {
  const raw = paper.createdAt
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

/** Newest-first, memoised per snapshot version so paging does not re-sort 1,250
 *  papers on every request in a warm instance. */
const sortedCache = new Map<string, Record<string, unknown>[]>()

function byNewest(ver: string, papers: Record<string, unknown>[]): Record<string, unknown>[] {
  const hit = sortedCache.get(ver)
  if (hit) return hit
  const sorted = [...papers].sort((a, b) => {
    const at = timeOf(a)
    const bt = timeOf(b)
    if (at !== bt) return bt - at
    // Stable tiebreak so paging cannot show or skip a paper when several share
    // a createdAt (common after a bulk Drive sync).
    return String(a.id ?? '') < String(b.id ?? '') ? -1 : 1
  })
  if (sortedCache.size > 4) sortedCache.clear()
  sortedCache.set(ver, sorted)
  return sorted
}

/** Apply `?limit`/`?offset` to a full snapshot body. Returns the body to send and
 *  the total paper count so the client knows whether more pages exist. */
function pagePayload(
  body: string,
  ver: string,
  req: VercelRequest,
): { body: string; total: number } {
  const { limit, offset } = paging(req)
  let parsed: { papers?: Record<string, unknown>[] } & Record<string, unknown>
  try {
    parsed = JSON.parse(body)
  } catch {
    return { body, total: 0 }
  }
  const all = Array.isArray(parsed.papers) ? parsed.papers : []
  if (!limit) return { body, total: all.length }

  const slice = byNewest(ver, all).slice(offset, offset + limit)
  return {
    body: JSON.stringify({ ...parsed, papers: slice, paged: true }),
    total: all.length,
  }
}

async function fromConvex(
  req: VercelRequest,
  res: VercelResponse,
  mode: 'full' | 'meta' = 'full',
): Promise<void> {
  if (!CONVEX_URL) {
    sendJson(res, 503, { error: 'Catalogue unavailable: no Convex URL configured.' })
    return
  }
  const post = async (path: string, args: unknown) => {
    const r = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args, format: 'json' }),
      signal: AbortSignal.timeout(CONVEX_TIMEOUT_MS),
    })
    if (!r.ok) throw new Error(`Convex ${path} -> ${r.status}`)
    return (await r.json()) as { value: unknown }
  }

  try {
    const [items, metrics, trends] = await Promise.all([
      post('catalogue:get', {}),
      post('metrics:getAll', {}),
      post('trends:getTop', { limit: 50 }),
    ])
    const papers = (items.value as Record<string, unknown>[]) ?? []
    const payload = {
      generatedAt: Date.now(),
      papers,
      metrics: (metrics.value as Record<string, unknown>[]) ?? [],
      trends: (trends.value as Record<string, unknown>[]) ?? [],
      // Same catalogue-wide totals the Redis snapshot carries, so a paged
      // request that falls back to Convex still reports real library numbers.
      summary: buildSummary(papers as SummarisablePaper[]),
    }
    const body = JSON.stringify(payload)
    const version = hashToVersion(body)
    const encoding = negotiate(req)

    // Always advertise a version, including on the fallback path, or the
    // client's next poll cannot tell whether anything changed.
    res.setHeader('x-snapshot-version', String(version))

    if (mode === 'meta') {
      sendJson(res, 200, { version, count: papers.length, generatedAt: payload.generatedAt })
      return
    }

    const ver = String(version)
    const paged = pagePayload(body, ver, req)

    // Key the compressed cache by the page, not by the snapshot version: on the
    // fallback path several pages share one version, and keying by version would
    // serve page 1's bytes back as page 2.
    const pageEtag = `"${createHash('sha1').update(paged.body).digest('hex').slice(0, 16)}"`
    res.setHeader('ETag', pageEtag)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Encoding', encoding)
    res.setHeader('Vary', 'Accept-Encoding')
    res.setHeader('X-Catalogue-Total', String(paged.total))
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
    res.status(200).send(compressed(paged.body, pageEtag, encoding))
  } catch (err) {
    sendJson(res, 502, {
      error: 'Catalogue unavailable.',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  // Cheap version probe used by the client poll. Reads the 8-byte version key
  // and nothing else — this is the request that runs every 10 minutes per tab,
  // so it must not touch the payload.
  if (req.query.meta === '1') {
    const redis = getRedis()
    if (!redis) {
      await fromConvex(req, res, 'meta')
      return
    }
    try {
      const ver = await withTimeout(redis.get<string>('cl:ver'), UPSTASH_TIMEOUT_MS, 'upstash get')
      sendJson(res, 200, { version: Number(ver ?? 0) })
    } catch {
      await fromConvex(req, res, 'meta')
    }
    return
  }

  const redis = getRedis()
  if (!redis) {
    await fromConvex(req, res)
    return
  }

  let snap: string | null = null
  try {
    snap = await withTimeout(redis.get<string>('cl:cat'), UPSTASH_TIMEOUT_MS, 'upstash get')
  } catch {
    await fromConvex(req, res)
    return
  }

  if (!snap) {
    // Cold cache — the first build lands within a minute of a catalogue write,
    // and the daily verify job keeps it warm from then on.
    await fromConvex(req, res)
    return
  }

  // The payload carries its own version and refresh metadata, so the ETag can
  // be the version. That means an unchanged catalogue produces an identical
  // ETag and the compression cache below is never rebuilt.
  let parsed: { version?: number } & Record<string, unknown>
  try {
    parsed = JSON.parse(snap)
  } catch {
    await fromConvex(req, res)
    return
  }
  const ver = String(parsed.version ?? 0)
  const etag = `"${ver}"`
  const current = req.query.v ? Number(req.query.v) : 0
  const { limit, offset } = paging(req)

  // Version probe: the client's copy is still good, so answer with nothing at
  // all. This is the whole point — an unchanged poll costs ~30 bytes instead of
  // the entire catalogue.
  //
  // Only for a whole-catalogue request. A paged client asking "is version n
  // still current?" while holding one page of many would take the 204 to mean
  // "you have everything", which is exactly the bug paging introduces, so it
  // gets the page instead.
  if (limit === 0 && current > 0 && Number(ver) === current) {
    res.setHeader('ETag', etag)
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
    res.setHeader('X-Snapshot-Version', ver)
    res.status(204).end()
    return
  }

  // The ETag covers the page as well as the version: the same version paged
  // differently is a different body, so a conditional request has to be matched
  // against the ETag of the page it is actually asking for. Matching the
  // whole-catalogue ETag first would hand a paged client a 304 and leave it
  // stuck on whichever slice it started with.
  const pageEtag = limit > 0 ? `"${ver}-${limit}-${offset}"` : etag

  // Conditional GET.
  if (req.headers['if-none-match'] === pageEtag) {
    res.setHeader('ETag', pageEtag)
    res.setHeader('Vary', 'Accept-Encoding')
    res.setHeader('X-Snapshot-Version', ver)
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
    res.status(304).end()
    return
  }

  const encoding = negotiate(req)
  const paged = pagePayload(snap, ver, req)

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Encoding', encoding)
  res.setHeader('Vary', 'Accept-Encoding')
  res.setHeader('ETag', pageEtag)
  res.setHeader('X-Snapshot-Version', ver)
  // Total papers in the catalogue, not in this page, so the client can decide
  // whether another scroll needs a fetch.
  res.setHeader('X-Catalogue-Total', String(paged.total))
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
  res.status(200).send(compressed(paged.body, pageEtag, encoding))
}
