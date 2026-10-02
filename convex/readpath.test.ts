// Tests for the read-path optimisations made to keep the app inside the Convex
// Free data-egress budget.
//
// Each test here corresponds to a change that removed table-wide reads. The
// assertions are about *behaviour that must not regress* (right rows returned,
// right errors raised) — the savings themselves are a property of the query
// plan, not something a functional test can see. What these tests do catch is
// the tempting "optimisation" of dropping the filter or the row, which is how
// the original bugs happened in the first place.

import { describe, expect, test, beforeEach } from 'vitest'
import { convexTest } from 'convex-test'
import schema from './schema'
import type { TestCtx } from '../tests/convex-helpers'
import { api, internal } from './_generated/api'
import { hashCatalogueItems } from './driveSync'
import { makePaper, seedCatalogue } from '../tests/convex-helpers'

const modules = import.meta.glob('./**/*.ts')
type T = TestCtx

async function setup(): Promise<T> {
  return convexTest(schema, modules)
}

describe('catalogue.getByIds', () => {
  // Regression: the handler used to `.slice(0, 50)` while the validator accepted
  // 100, so a caller asking for 60 papers silently got 50 and rendered blank
  // cards with no error anywhere.
  test('returns every requested id up to the 100 limit', async () => {
    const t = await setup()
    const ids = Array.from({ length: 100 }, (_, i) => `p${i}`)
    await seedCatalogue(t, ids.map((id) => ({ id })))

    const rows = await t.query(api.catalogue.getByIds, { ids })

    expect(rows).toHaveLength(100)
    expect(rows.map((r) => r.id).sort()).toEqual([...ids].sort())
  })

  test('rejects more than 100 ids rather than truncating', async () => {
    const t = await setup()
    const ids = Array.from({ length: 101 }, (_, i) => `p${i}`)

    await expect(t.query(api.catalogue.getByIds, { ids })).rejects.toThrow()
  })

  test('skips ids that do not exist without erroring', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'real' }])

    const rows = await t.query(api.catalogue.getByIds, { ids: ['real', 'ghost'] })

    expect(rows.map((r) => r.id)).toEqual(['real'])
  })
})

describe('catalogue.facets', () => {
  // The "all levels, one program" branch used to walk the by_created index and
  // filter in JS — a full table read on every filter change. It now uses the
  // by_program index. These tests pin the scope so the faster path cannot
  // quietly widen and return other programs' courses.
  test('scopes courses to the requested program when level is "all"', async () => {
    const t = await setup()
    await seedCatalogue(t, [
      { id: 'cs1', program: 'cs', course: 'CSC101', courseName: 'CSC 101 — Intro' },
      { id: 'ee1', program: 'ee', course: 'EEE101', courseName: 'EEE 101 — Circuits' },
    ])

    const facets = await t.query(api.catalogue.facets, { levelYear: 'all', program: 'cs', college: 'all' })

    const ids = facets.courses.map((c) => c.id)
    expect(ids).toContain('CSC101')
    expect(ids).not.toContain('EEE101')
  })

  test('scopes by level and program together', async () => {
    const t = await setup()
    await seedCatalogue(t, [
      { id: 'a', program: 'cs', levelYear: '1', course: 'CSC101', courseName: 'CSC 101' },
      { id: 'b', program: 'cs', levelYear: '2', course: 'CSC201', courseName: 'CSC 201' },
      { id: 'c', program: 'ee', levelYear: '1', course: 'EEE101', courseName: 'EEE 101' },
    ])

    const facets = await t.query(api.catalogue.facets, { levelYear: '1', program: 'cs', college: 'all' })

    const ids = facets.courses.map((c) => c.id)
    expect(ids).toEqual(['CSC101'])
  })

  test('"all"/"all" spans the whole catalogue', async () => {
    const t = await setup()
    await seedCatalogue(t, [
      { id: 'a', program: 'cs', course: 'CSC101', courseName: 'CSC 101' },
      { id: 'b', program: 'ee', course: 'EEE101', courseName: 'EEE 101' },
    ])

    const facets = await t.query(api.catalogue.facets, { levelYear: 'all', program: 'all', college: 'all' })

    expect(facets.courses.map((c) => c.id).sort()).toEqual(['CSC101', 'EEE101'])
  })
})

describe('driveSync fingerprint', () => {
  // The whole point of the sync gate: an unchanged Drive tree must produce an
  // identical fingerprint, so the sync action can skip the diff entirely.
  test('is stable across identical input', () => {
    const a = hashCatalogueItems([makePaper({ id: 'p1' }), makePaper({ id: 'p2' })])
    const b = hashCatalogueItems([makePaper({ id: 'p1' }), makePaper({ id: 'p2' })])
    expect(a).toBe(b)
  })

  test('does not depend on Drive folder ordering', () => {
    const items = [makePaper({ id: 'p1' }), makePaper({ id: 'p2' }), makePaper({ id: 'p3' })]
    const forward = hashCatalogueItems(items)
    const reversed = hashCatalogueItems([...items].reverse())
    expect(forward).toBe(reversed)
  })

  test('changes when a paper is added', () => {
    const before = hashCatalogueItems([makePaper({ id: 'p1' })])
    const after = hashCatalogueItems([makePaper({ id: 'p1' }), makePaper({ id: 'p2' })])
    expect(after).not.toBe(before)
  })

  test('changes when a paper is removed', () => {
    const before = hashCatalogueItems([makePaper({ id: 'p1' }), makePaper({ id: 'p2' })])
    const after = hashCatalogueItems([makePaper({ id: 'p1' })])
    expect(after).not.toBe(before)
  })

  test.each([
    ['title', { title: 'Renamed' }],
    ['license', { license: 'CC BY-NC 4.0' }],
    ['course', { course: 'CSC999' }],
    ['levelYear', { levelYear: '3' }],
    ['teacher', { teacher: 'Dr New' }],
  ])('changes when %s changes', (_field, override) => {
    const before = hashCatalogueItems([makePaper({ id: 'p1' })])
    const after = hashCatalogueItems([makePaper({ id: 'p1', ...override })])
    expect(after).not.toBe(before)
  })

  test('ignores fields that do not affect the catalogue listing', () => {
    const before = hashCatalogueItems([makePaper({ id: 'p1' })])
    const after = hashCatalogueItems([makePaper({ id: 'p1', parents: ['x', 'y'] })])
    // `parents` is dead weight on the wire; a Drive folder move that only
    // touches it must not trigger a full re-diff.
    expect(after).toBe(before)
  })
})

describe('catalogue.lastAppliedTreeHash', () => {
  test('is null before the first sync', async () => {
    const t = await setup()
    expect(await t.query(internal.catalogue.lastAppliedTreeHash, {})).toBeNull()
  })

  test('round-trips the recorded fingerprint', async () => {
    const t = await setup()
    await t.mutation(internal.catalogue.recordAppliedTreeHash, { hash: 'abc123', count: 42 })

    expect(await t.query(internal.catalogue.lastAppliedTreeHash, {})).toEqual({
      hash: 'abc123',
      count: 42,
    })
  })

  test('overwrites rather than accumulating rows', async () => {
    const t = await setup()
    await t.mutation(internal.catalogue.recordAppliedTreeHash, { hash: 'first', count: 1 })
    await t.mutation(internal.catalogue.recordAppliedTreeHash, { hash: 'second', count: 2 })

    expect(await t.query(internal.catalogue.lastAppliedTreeHash, {})).toEqual({
      hash: 'second',
      count: 2,
    })
    const rows = await t.run(async (ctx) => ctx.db.query('driveSyncState').collect())
    expect(rows).toHaveLength(1)
  })
})

describe('metrics.getByIds', () => {
  test('returns only the requested papers', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }, { id: 'p2' }])
    await t.mutation(api.metrics.bump, { paper_id: 'p1', kind: 'reads', delta: 1 })
    await t.mutation(api.metrics.bump, { paper_id: 'p2', kind: 'reads', delta: 1 })

    const rows = await t.query(api.metrics.getByIds, { ids: ['p1'] })

    expect(rows).toHaveLength(1)
    const [row] = rows
    expect(row?.paper_id).toBe('p1')
    expect(row?.reads).toBe(1)
  })
})

describe('submissions.getFile', () => {
  // Regression: this collected the entire submissions table and scanned it in
  // JS to find one row, so every paper-open on mobile read every submission
  // ever uploaded. It is now a point read via the id embedded in `subId`.
  test('rejects an id that is not a submission reference', async () => {
    const t = await setup()
    expect(await t.query(api.submissions.getFile, { subId: 'p1' })).toBeNull()
  })

  test('rejects a malformed id instead of scanning for a match', async () => {
    const t = await setup()
    expect(await t.query(api.submissions.getFile, { subId: 'sub_not-an-id' })).toBeNull()
  })

  test('returns null for an id that does not exist', async () => {
    const t = await setup()
    expect(await t.query(api.submissions.getFile, { subId: 'sub_abc123' })).toBeNull()
  })
})

describe('seed helper sanity', () => {
  // Guards the helper itself: a silently-wrong seed row would make every other
  // assertion in this file meaningless.
  test('makePaper produces a schema-valid row', async () => {
    const t = await setup()
    await seedCatalogue(t, [{ id: 'p1' }])
    const rows = await t.query(api.catalogue.getByIds, { ids: ['p1'] })
    expect(rows[0]).toMatchObject({ id: 'p1', fileExt: 'pdf' })
  })
})

beforeEach(() => {
  // No env needed for these; the snapshot is not exercised here.
})
