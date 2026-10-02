/// <reference types="node" />
// Shared helpers for convex-test suites.
//
// Note on the API: convex-test 0.0.60 exposes `query`/`mutation`/`action`
// (which accept a function *reference* plus args). The widely-documented
// `t.run(reference, args)` form is not supported in this version — `run` takes
// an inline handler only — and silently degrades to a mutation with no args.
//
// Note on env: convex-test has no `withEnv` helper, but Convex's `env` resolves
// through `process.env` under the test runtime, so setting the variables there
// is enough.
import type { TestConvexForDataModel } from 'convex-test'
import { internal } from '../convex/_generated/api'
import type { CatalogueItem } from '../src/schema/catalogue'

/** The handle `convexTest(schema, modules)` returns, for helper signatures. */
export type TestCtx = TestConvexForDataModel<any>

const REDIS_VARS = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'] as const

/** Pretend Upstash is (not) provisioned. */
export function setRedisEnabled(enabled: boolean): void {
  for (const k of REDIS_VARS) {
    if (enabled) {
      process.env[k] = k === 'UPSTASH_REDIS_REST_URL' ? 'https://test.upstash.io' : 'test-token'
    } else {
      delete process.env[k]
    }
  }
}

type PaperOverrides = Partial<CatalogueItem>

/**
 * Replace the whole catalogue using the real internal mutation, so seeded rows
 * have exactly the shape production writes. (It schedules a forced snapshot
 * refresh; convex-test does not auto-run scheduled functions, so tests stay in
 * control of when that fires.)
 */
export async function seedCatalogue(
  t: TestCtx,
  papers: PaperOverrides[],
): Promise<void> {
  await t.mutation(internal.catalogue.replaceAll, { items: papers.map((p) => makePaper(p)) })
}

/** Read the snapshotMeta singleton. Fails loudly if it is missing. */
export async function getSnapshotMeta(t: TestCtx) {
  const meta = await t.query(internal.snapshot.status, {})
  if (meta === null) throw new Error('snapshotMeta row not found')
  return meta
}

/**
 * A valid catalogue row. Typed as `CatalogueItem` on purpose: if the schema
 * gains a required field, this stops compiling instead of every test failing
 * with a confusing validator error.
 */
export function makePaper(overrides: PaperOverrides = {}): CatalogueItem {
  const id = overrides.id ?? 'p1'
  return {
    id,
    title: `Paper ${id}`,
    subtitle: '',
    subject: 'maths',
    subjectName: 'Mathematics',
    course: 'MATH101',
    courseName: 'MATH 101 — Calculus',
    type: 'notes',
    year: 2024,
    pages: 12,
    upvotes: 0,
    downvotes: 0,
    downloads: 0,
    views: 0,
    contributor: 'test@example.com',
    contributorName: 'Test',
    teacher: 'Dr Test',
    cover: 0,
    mimeType: 'application/pdf',
    fileExt: 'pdf',
    sizeLabel: '1.2 MB',
    previewUrl: `https://drive.google.com/file/d/${id}/preview`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    createdAt: '2024-01-01T00:00:00.000Z',
    parents: [],
    college: 'Engineering',
    program: 'cs',
    level: '101',
    levelYear: '1',
    semester: 'term1',
    deptSection: 'A',
    license: 'CC BY-SA 4.0',
    fileId: id,
    ...overrides,
  }
}
