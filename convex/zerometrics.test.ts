// Tests for `catalogue.zeroFabricatedMetrics` (convex/catalogue.ts).
//
// `driveSync.buildPaper` used to seed `upvotes`/`downvotes`/`downloads`/`views`
// from a hash of the Drive file id, so all 1,276 papers displayed invented
// numbers. buildPaper now emits zeros, but that alone changes nothing on the
// live site: `syncDiffFromDrive` short-circuits on an unchanged Drive tree
// fingerprint before `applyDiff` ever runs, and that fingerprint does not
// include the counters. This backfill is what actually clears the stored rows.
//
// What must not regress, and is what these tests pin:
//   1. a paper with NO `metrics` row has its fabricated counters zeroed
//   2. a paper WITH a `metrics` row is left completely alone — that row is the
//      only place a real counter has ever lived, and clobbering it would destroy
//      accumulated data
//   3. running it twice is a no-op the second time (idempotent)
//   4. `pages` and `cover` — a real size-derived estimate and the load-bearing
//      greyscale cover index — are never touched

import { describe, expect, test, beforeEach, vi } from 'vitest'
import { convexTest } from 'convex-test'
import schema from './schema'
import type { TestCtx } from '../tests/convex-helpers'
import { api, internal } from './_generated/api'
import { makePaper, seedCatalogue, setRedisEnabled } from '../tests/convex-helpers'

const mset = vi.fn(async (_kv: Record<string, string>) => 'OK')
const expire = vi.fn(async (_key: string, _ttlSeconds: number) => 1)

// Mocked so the read-model assertions below can inspect exactly what the
// migration republished, without a network call.
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

beforeEach(() => {
  mset.mockClear()
  expire.mockClear()
  setRedisEnabled(true)
})

/** The four engagement counters, which is all this migration is allowed to touch. */
function counters(p: { upvotes: number; downvotes: number; downloads: number; views: number }) {
  return { upvotes: p.upvotes, downvotes: p.downvotes, downloads: p.downloads, views: p.views }
}

async function runBackfill(t: T, limit?: number) {
  return t.mutation(internal.catalogue.zeroFabricatedMetrics, limit === undefined ? {} : { limit })
}

/** Seed a `metrics` row directly — that is what `metrics.bump` writes. */
async function seedMetric(
  t: T,
  paperId: string,
  row: { reads: number; downloads: number; upvotes: number; downvotes: number },
) {
  await t.run(async (ctx) => {
    await ctx.db.insert('metrics', { paper_id: paperId, ...row })
  })
}

describe('catalogue.zeroFabricatedMetrics', () => {
  test('zeroes the fabricated counters on a paper with no metrics row', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'fake', upvotes: 712, downvotes: 33, downloads: 3092, views: 10343 }])

    const result = await runBackfill(t)

    expect(result).toMatchObject({ done: true, scanned: 1, patched: 1, spared: 0 })
    const [row] = await t.query(api.catalogue.getByIds, { ids: ['fake'] })
    expect(counters(row!)).toEqual({ upvotes: 0, downvotes: 0, downloads: 0, views: 0 })
  })

  test('leaves a paper that has a metrics row completely untouched', async () => {
    const t = await setup()
    // This row carries BOTH the fabricated catalogue counters and a real
    // `metrics` row. Only the catalogue row's shadowed values are fake, but the
    // `metrics` row is the paper's entire real history and must survive.
    await seedCatalogue(t, [{ id: 'real', upvotes: 712, downvotes: 33, downloads: 3092, views: 10343 }])
    await seedMetric(t, 'real', { reads: 21, downloads: 0, upvotes: 3, downvotes: 1 })

    const result = await runBackfill(t)

    expect(result).toMatchObject({ done: true, patched: 0, spared: 1 })
    const [row] = await t.query(api.catalogue.getByIds, { ids: ['real'] })
    expect(counters(row!)).toEqual({ upvotes: 712, downvotes: 33, downloads: 3092, views: 10343 })
    // The real counters themselves are never opened, let alone written.
    const metrics = await t.query(api.metrics.getByIds, { ids: ['real'] })
    expect(metrics[0]).toMatchObject({ reads: 21, upvotes: 3, downvotes: 1 })
  })

  test('is idempotent — the second run writes nothing', async () => {
    const t = await setup()
    await seedCatalogue(t, [
      { id: 'fake', upvotes: 712, views: 10343 },
      { id: 'real', upvotes: 400, views: 9000 },
    ])
    await seedMetric(t, 'real', { reads: 5, downloads: 0, upvotes: 2, downvotes: 0 })

    const first = await runBackfill(t)
    expect(first).toMatchObject({ done: true, patched: 1, spared: 1 })

    const second = await runBackfill(t)
    expect(second).toMatchObject({ done: true, patched: 0, spared: 1 })

    // ...and the "real" paper is still exactly as it was after both runs.
    const rows = await t.query(api.catalogue.getByIds, { ids: ['real'] })
    expect(counters(rows[0]!)).toEqual({ upvotes: 400, downvotes: 0, downloads: 0, views: 9000 })
  })

  test('never touches pages or the greyscale cover index', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p', pages: 244, cover: 7, views: 10343 }])

    await runBackfill(t)

    const [row] = await t.query(api.catalogue.getByIds, { ids: ['p'] })
    expect(row).toMatchObject({ pages: 244, cover: 7 })
  })

  test('a partial `limit` reports done:false and the next call finishes the job', async () => {
    const t = await setup()
    await seedCatalogue(t, [
      { id: 'a', views: 10 },
      { id: 'b', views: 20 },
      { id: 'c', views: 30 },
    ])

    const first = await runBackfill(t, 2)
    expect(first).toMatchObject({ done: false, patched: 2 })

    const second = await runBackfill(t, 2)
    expect(second).toMatchObject({ done: true, patched: 1 })

    const third = await runBackfill(t, 2)
    expect(third).toMatchObject({ done: true, patched: 0 })

    const rows = await t.query(api.catalogue.getByIds, { ids: ['a', 'b', 'c'] })
    expect(rows.every((r) => r.views === 0)).toBe(true)
  })

  test('an already-honest catalogue is a no-op', async () => {
    const t = await setup()
    await seedCatalogue(t, [makePaper({ id: 'honest' })])

    expect(await runBackfill(t)).toMatchObject({ done: true, scanned: 1, patched: 0, spared: 0 })
  })

  // The web app reads the Upstash snapshot, not these tables, so a backfill that
  // did not invalidate the read model would be invisible on the live site until
  // the next debounced rebuild (up to 15 minutes) or the daily verify. This is
  // the one assertion that makes the migration real rather than cosmetic.
  test('rebuilds the read model so the live site stops serving the fake numbers', async () => {
    mset.mockClear()
    const t = await setup()
    await seedCatalogue(t, [{ id: 'fake', views: 10343, upvotes: 712 }])

    await runBackfill(t)
    await t.finishAllScheduledFunctions(() => {})

    expect(mset).toHaveBeenCalled()
    const calls = mset.mock.calls
    const payload = JSON.parse(calls[calls.length - 1]![0]!['cl:cat']!)
    expect(payload.papers[0]).toMatchObject({ id: 'fake', views: 0, upvotes: 0 })
  })

  test('a no-op run does not churn the read model', async () => {
    const t = await setup()
    await seedCatalogue(t, [makePaper({ id: 'honest' })])

    await runBackfill(t)
    await t.finishAllScheduledFunctions(() => {})
    mset.mockClear()

    await runBackfill(t)
    await t.finishAllScheduledFunctions(() => {})

    expect(mset).not.toHaveBeenCalled()
  })

  // Community submissions are already honest (submissions.ts seeds them at 0),
  // so this guards the opposite regression: the migration must not be what makes
  // a fresh upload look right, and must not disturb an upload that has since
  // been voted on.
  test('community uploads gain real votes through `metrics`, not catalogue rows', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'sub_abc', upvotes: 0, downvotes: 0, downloads: 0, views: 0 }])

    await t.mutation(api.votes.toggle, { paperId: 'sub_abc', deviceHash: 'device-1', value: 1 })

    const metrics = await t.query(api.metrics.getByIds, { ids: ['sub_abc'] })
    expect(metrics[0]).toMatchObject({ upvotes: 1, downvotes: 0 })

    // The catalogue row is still zero — the overlay supplies the real number —
    // and the backfill therefore has nothing to do to it.
    const rows = await t.query(api.catalogue.getByIds, { ids: ['sub_abc'] })
    expect(counters(rows[0]!)).toEqual({ upvotes: 0, downvotes: 0, downloads: 0, views: 0 })
    expect(await runBackfill(t)).toMatchObject({ patched: 0, spared: 1 })
  })
})