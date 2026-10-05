// Tests for the Upstash read snapshot (convex/snapshot.ts).
//
// The snapshot is what keeps the web app off the Convex Free egress limit, so
// the properties asserted here are the ones that, if they broke, would silently
// reintroduce the cost problem or blank the library:
//
//   1. an unchanged rebuild does NOT bump the version (otherwise every client
//      poll re-downloads the whole catalogue instead of getting a 204)
//   2. a changed rebuild bumps the version exactly once
//   3. concurrent triggers collapse into one rebuild
//   4. an empty catalogue is refused rather than published
//
// Redis is stubbed at the module boundary: these tests are about the snapshot's
// own logic, not Upstash's client.

import { describe, expect, test, beforeEach, vi } from 'vitest'
import { convexTest } from 'convex-test'
import schema from './schema'
import type { TestCtx } from '../tests/convex-helpers'
import { internal } from './_generated/api'
import { getSnapshotMeta, seedCatalogue, setRedisEnabled } from '../tests/convex-helpers'
// Mock @upstash/redis so no test ever touches the network, and so we can assert
// exactly which keys get written and with what TTL.
//
// The parameter types are declared explicitly so `mock.calls[n][i]` is typed —
// `vi.fn(async () => ...)` infers a zero-arg function and every call-site
// assertion becomes a type error.
const mset = vi.fn(async (_kv: Record<string, string>) => 'OK')
const expire = vi.fn(async (_key: string, _ttlSeconds: number) => 1)

vi.mock('@upstash/redis', () => ({
  Redis: class {
    mset = mset
    expire = expire
  },
}))

const modules = import.meta.glob('./**/*.ts')

type T = TestCtx

async function setup(): Promise<T> {
  return convexTest(schema, modules)
}

/** Every call goes through these so the Upstash env is always set. */
const refresh = (t: T, force = false) => t.action(internal.snapshot.refresh, { force })
const verify = (t: T) => t.action(internal.snapshot.verify, {})
const buildPayload = (t: T, now: number) => t.query(internal.snapshot.buildPayload, { now })
const claim = (t: T, minIntervalMs: number) =>
  t.mutation(internal.snapshot.claimRefresh, { minIntervalMs })

/** The (key, ttl) pairs passed to EXPIRE, sorted, for readable assertions. */
function expireKeysAndTtls(): [string, number][] {
  return expire.mock.calls
    .map((c) => [c[0], c[1]] as [string, number])
    .sort((a, b) => a[0].localeCompare(b[0]))
}

/** The single MSET payload from the nth refresh. Fails loudly if absent. */
function writtenKeys(n = 0): Record<string, string> {
  const call = mset.mock.calls[n]
  if (!call) throw new Error(`expected an mset call at index ${n}, got ${mset.mock.calls.length}`)
  return call[0]
}

beforeEach(() => {
  mset.mockClear()
  mset.mockResolvedValue('OK')
  expire.mockClear()
  expire.mockResolvedValue(1)
  setRedisEnabled(true)
})

describe('snapshot.buildPayload', () => {
  test('drops `parents` — dead weight no client reads', async () => {
    const t = await setup()
    await seedCatalogue(t, [
      { id: 'p1', parents: ['a', 'b', 'c'] },
      { id: 'p2', parents: [] },
    ])

    const payload = await buildPayload(t, 1_000)

    expect(payload.papers).toHaveLength(2)
    for (const p of payload.papers) {
      expect(p).not.toHaveProperty('parents')
    }
    // ...but the real fields survive.
    expect(payload.papers[0]).toMatchObject({ id: 'p1' })
  })

  test('takes `now` as an argument so the query stays deterministic', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])

    // Same input, same output — proof there is no hidden wall-clock read, which
    // Convex rejects in queries.
    const a = await buildPayload(t, 5_000)
    const b = await buildPayload(t, 5_000)

    expect(a).toEqual(b)
    expect(a.generatedAt).toBe(5_000)
  })

  // The client loads papers a page at a time, so any total derived from
  // `papers` would report the page size ("5 Papers") instead of the library size.
  // These assertions are what keep that number honest on a partial load.
  describe('whole-catalogue summary', () => {
    test('counts every paper, not the page that happens to be loaded', async () => {
      const t = await setup()
      await seedCatalogue(t, [
        { id: 'p1' },
        { id: 'p2' },
        { id: 'p3', subject: 'cs', subjectName: 'Computer Science' },
      ])

      const { summary } = await buildPayload(t, 1_000)

      expect(summary.papers).toBe(3)
      expect(summary.subjects.map((s) => s.id).sort()).toEqual(['cs', 'maths'])
    })

    test('sums reads into the per-month figure the home page shows', async () => {
      const t = await setup()
      await seedCatalogue(t, [
        { id: 'p1', views: 120 },
        { id: 'p2', views: 120 },
      ])

      const { summary } = await buildPayload(t, 1_000)

      // 240 total reads / 12 months.
      expect(summary.reads).toBe(20)
    })

    test('counts distinct contributors', async () => {
      const t = await setup()
      await seedCatalogue(t, [
        { id: 'p1', contributor: 'a@example.com' },
        { id: 'p2', contributor: 'b@example.com' },
        { id: 'p3', contributor: 'a@example.com' },
      ])

      const { summary } = await buildPayload(t, 1_000)

      expect(summary.contributors).toBe(2)
    })

    test('orders subjects by paper count, most first', async () => {
      const t = await setup()
      await seedCatalogue(t, [
        { id: 'p1', subject: 'maths', subjectName: 'Mathematics' },
        { id: 'p2', subject: 'cs', subjectName: 'Computer Science' },
        { id: 'p3', subject: 'cs', subjectName: 'Computer Science' },
      ])

      const { summary } = await buildPayload(t, 1_000)

      expect(summary.subjects[0]).toMatchObject({ id: 'cs', count: 2 })
      expect(summary.subjects[1]).toMatchObject({ id: 'maths', count: 1 })
    })
  })
})

describe('snapshot.refresh', () => {
  test('first refresh writes the snapshot and starts at version 1', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }, { id: 'p2' }])

    const result = await refresh(t)

    expect(result.status).toBe('written')
    expect(result.version).toBe(1)
    expect(result.count).toBe(2)
    expect(result.sha).toBeTruthy()
    expect(mset).toHaveBeenCalledTimes(1)

    // Two keys in a single MSET: the whole read model plus the version the
    // client probes with.
    const written = writtenKeys()
    expect(Object.keys(written).sort()).toEqual(['cl:cat', 'cl:ver'])
    expect(written['cl:ver']).toBe('1')

    // The version is embedded in the payload too, so it is self-contained.
    const payload = JSON.parse(written['cl:cat']!)
    expect(payload.version).toBe(1)
    expect(payload.papers).toHaveLength(2)
    expect(payload.refreshCount).toBe(1)

    const meta = await getSnapshotMeta(t)
    expect(meta.version).toBe(1)
    expect(meta.refreshCount).toBe(1)
    expect(meta.lastError).toBeNull()
  })

  test('both keys get the long TTL', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])

    await refresh(t)

    // 30 days. Short of Upstash's 30-day inactivity archive window, so a cache
    // that stops being written expires cleanly instead of freezing stale.
    expect(expire).toHaveBeenCalledTimes(2)
    expect(expireKeysAndTtls()).toEqual([
      ['cl:cat', 30 * 24 * 60 * 60],
      ['cl:ver', 30 * 24 * 60 * 60],
    ])
  })

  test('an unchanged rebuild refreshes the TTL without rewriting the payload', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])
    await refresh(t)

    mset.mockClear()
    expire.mockClear()
    const result = await verify(t)

    // No MSET: the stored bytes are still correct and rewriting them would
    // churn the ETag and invalidate every client's cache.
    expect(result.status).toBe('unchanged')
    expect(mset).not.toHaveBeenCalled()

    // ...but the TTL is refreshed, so a library nobody edits for 30 days does
    // not quietly expire into the slow Convex path.
    expect(expire).toHaveBeenCalledTimes(2)
    for (const [, ttl] of expireKeysAndTtls()) {
      expect(ttl).toBe(30 * 24 * 60 * 60)
    }
  })

  test('the payload reports the real refresh count, not the paper count', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }])

    await refresh(t)

    const payload = JSON.parse(writtenKeys()['cl:cat']!)
    expect(payload.papers).toHaveLength(3)
    // Regression: this used to be `claim.count + 1`, i.e. paperCount + 1.
    expect(payload.refreshCount).toBe(1)
  })

  // Regression test: `generatedAt: Date.now()` used to sit inside the hashed
  // payload, so every rebuild hashed differently, the "unchanged" branch was
  // unreachable, the version incremented on every write, and every client poll
  // got a full 200 instead of a 204.
  test('a rebuild with identical content is `unchanged` and keeps the version', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }, { id: 'p2' }])

    const first = await refresh(t)
    expect(first.status).toBe('written')
    expect(first.version).toBe(1)

    mset.mockClear()
    // verify() bypasses the debounce, so this exercises the content comparison
    // rather than the coalescing window.
    const second = await verify(t)

    expect(second.status).toBe('unchanged')
    expect(second.version).toBe(1)
    // Nothing rewritten: every client's cached copy stays valid.
    expect(mset).not.toHaveBeenCalled()
    expect((await getSnapshotMeta(t)).version).toBe(1)
  })

  test('changing the catalogue bumps the version exactly once', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])
    expect((await refresh(t)).version).toBe(1)

    await seedCatalogue(t, [{ id: 'p1' }, { id: 'p2' }])

    mset.mockClear()
    const result = await verify(t)

    expect(result.status).toBe('written')
    expect(result.version).toBe(2)
    expect(result.count).toBe(2)
    expect(mset).toHaveBeenCalledTimes(1)
  })

  test('a second trigger inside the debounce window is a no-op', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])

    await refresh(t)
    mset.mockClear()

    const second = await refresh(t)

    expect(second.status).toBe('debounced')
    expect(second.version).toBe(1)
    expect(mset).not.toHaveBeenCalled()
  })

  test('refuses to publish an empty catalogue', async () => {
    const t = await setup()
    // No papers at all — publishing this would blank the library for everyone.
    await expect(refresh(t)).rejects.toThrow(/Refusing to publish/i)

    expect(mset).not.toHaveBeenCalled()
    // The failure is recorded so `status` can surface it.
    expect((await getSnapshotMeta(t)).lastError).toMatch(/Refusing to publish/i)
  })

  test('skips cleanly when Upstash is not provisioned', async () => {
    setRedisEnabled(false)
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])

    const result = await refresh(t)

    // Degraded-but-correct: the Vercel function falls through to Convex.
    expect(result.status).toBe('skipped-no-config')
    expect(result.error).toBeNull()
    expect(mset).not.toHaveBeenCalled()
  })

  test('a Redis failure is recorded and rethrown so the cron log shows it', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])
    mset.mockRejectedValueOnce(new Error('upstash 503'))

    await expect(refresh(t)).rejects.toThrow('upstash 503')
    expect((await getSnapshotMeta(t)).lastError).toBe('upstash 503')
  })

  test('a failed attempt releases the claim so the next trigger retries at once', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])
    mset.mockRejectedValueOnce(new Error('upstash 503'))
    await expect(refresh(t)).rejects.toThrow('upstash 503')

    mset.mockResolvedValue('OK')
    const retry = await refresh(t)

    // Without failRefresh clearing the claim, this would be "debounced" and the
    // library would serve stale data for the full 15-minute window.
    expect(retry.status).toBe('written')
    expect(retry.version).toBe(1)
    expect((await getSnapshotMeta(t)).lastError).toBeNull()
  })

  test('claimRefresh is exclusive under concurrency', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])

    // Two callers at the same instant: OCC on the singleton row means exactly
    // one wins, so the full-table rebuild cannot run twice.
    const [a, b] = await Promise.all([claim(t, 60_000), claim(t, 60_000)])

    expect([a.claimed, b.claimed].filter(Boolean)).toHaveLength(1)
  })
})
