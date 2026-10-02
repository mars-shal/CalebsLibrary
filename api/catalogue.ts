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
//
// Degradation is deliberate and total: if Upstash is unconfigured, empty, or
// erroring, this falls through to the Convex query and the app behaves exactly
// as it did before. Redis is an optimisation here, never a dependency.
//
// The Upstash token is read from the Vercel environment and must never reach
// the client. It is also NOT the same value as the Convex env copy — rotate
// them independently if one is ever exposed.

import { Redis } from '@upstash/redis'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const CONVEX_URL = process.env.VITE_CONVEX_URL

// Upstash's free tier serves commands from a regional endpoint; 3s is generous
// for a single GET but short enough that a cold cache does not stall a page.
const UPSTASH_TIMEOUT_MS = 3000
const CONVEX_TIMEOUT_MS = 8000

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

// The payload is a few hundred KB of JSON that compresses ~6x. Gzip once per
// snapshot version and hold it in the warm function instance, so repeat
// requests never re-compress. Keyed on version, which is stable until the
// catalogue actually changes.
let gzipCache: { version: string; body: Buffer } | null = null

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
async function fromConvex(res: VercelResponse, mode: 'full' | 'meta' = 'full'): Promise<void> {
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
    }
    const body = JSON.stringify(payload)
    const version = hashToVersion(body)

    // Always advertise a version, including on the fallback path, or the
    // client's next poll cannot tell whether anything changed.
    res.setHeader('x-snapshot-version', String(version))

    if (mode === 'meta') {
      sendJson(res, 200, { version, count: papers.length, generatedAt: payload.generatedAt })
      return
    }

    const gz = gzipSync(Buffer.from(body, 'utf8'))
    res.setHeader('ETag', `"${createHash('sha1').update(body).digest('hex').slice(0, 16)}"`)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
    res.status(200).send(gz)
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
      await fromConvex(res, 'meta')
      return
    }
    try {
      const ver = await withTimeout(redis.get<string>('cl:ver'), UPSTASH_TIMEOUT_MS, 'upstash get')
      sendJson(res, 200, { version: Number(ver ?? 0) })
    } catch {
      await fromConvex(res, 'meta')
    }
    return
  }

  const redis = getRedis()
  if (!redis) {
    await fromConvex(res)
    return
  }

  let snap: string | null = null
  try {
    snap = await withTimeout(redis.get<string>('cl:cat'), UPSTASH_TIMEOUT_MS, 'upstash get')
  } catch {
    await fromConvex(res)
    return
  }

  if (!snap) {
    // Cold cache — the first build lands within a minute of a catalogue write,
    // and the daily verify job keeps it warm from then on.
    await fromConvex(res)
    return
  }

  // The payload carries its own version and refresh metadata, so the ETag can
  // be the version. That means an unchanged catalogue produces an identical
  // ETag and the gzip cache below is never rebuilt.
  let parsed: { version?: number } & Record<string, unknown>
  try {
    parsed = JSON.parse(snap)
  } catch {
    await fromConvex(res)
    return
  }
  const ver = String(parsed.version ?? 0)
  const etag = `"${ver}"`
  const current = req.query.v ? Number(req.query.v) : 0

  // Version probe: the client's cached copy is still good, so answer with
  // nothing at all. This is the whole point — an unchanged poll costs ~30 bytes
  // instead of the entire catalogue.
  if (current > 0 && Number(ver) === current) {
    res.setHeader('ETag', etag)
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
    res.setHeader('X-Snapshot-Version', ver)
    res.status(204).end()
    return
  }

  // Conditional GET.
  if (req.headers['if-none-match'] === etag) {
    res.setHeader('ETag', etag)
    res.setHeader('X-Snapshot-Version', ver)
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
    res.status(304).end()
    return
  }

  if (!gzipCache || gzipCache.version !== ver) {
    gzipCache = { version: ver, body: gzipSync(Buffer.from(snap, 'utf8')) }
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Encoding', 'gzip')
  res.setHeader('ETag', etag)
  res.setHeader('X-Snapshot-Version', ver)
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
  res.status(200).send(gzipCache.body)
}
