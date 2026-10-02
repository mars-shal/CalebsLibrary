// Caleb's Library — server-side Google Drive tree walk.
//
// Walks the real Drive tree and produces plain CatalogueItem[] objects:
//   Root (all colleges) → College → Level (100–400) → Semester
//   → Dept section (General/Departmental)
//   → [Dept folder] → Course folder → (Notes / Past Questions) → files
//
// This module runs ONLY inside Convex (action context). The Drive API key is
// received as a parameter from the caller (read from the Convex env), so it
// never ships to the browser and — critically — is never persisted onto a
// catalogue row. Rows carry key-free public Drive URLs; keyed URLs are minted
// at request time by the `files.downloadUrl` action.

import {
  CODE_SUBJECTS,
  catalogueItemSchema,
  type CatalogueItem,
  slugify,
  parseCourseName,
  hashString,
  extFromName,
  formatBytes,
  estimatePages,
  levelYearOf,
  DEFAULT_LICENSE,
} from "../src/schema/catalogue";

// Drive-walking internals are owned by this server module so nothing
// Drive-related ships in the client bundle (the API key is a Convex env var).
const ROOT_FOLDER_ID = '1B1LUmkcAA4yl5j8_jan2vEjGphDS3KWR'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_FIELDS =
  'files(id,name,mimeType,createdTime,size,webViewLink,parents,owners(displayName,emailAddress))'
const MATERIAL_MIME = /pdf|officedocument|image\/|plain|msword|vnd\.ms-/

interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime?: string
  size?: string
  webViewLink?: string
  parents?: string[]
  owners?: { displayName?: string; emailAddress?: string }[]
}

// Type detection accounts for the folder path (Notes / Past Questions).
function detectType(fileName: string, types: string[]): string {
  const n = fileName.toLowerCase()
  if (/(past ?question|exam|test)/.test(n) || types.includes('Past Questions')) return 'Past Exam'
  if (/(assign|problem|tutorial|worksheet)/.test(n)) return 'Problem Set'
  if (/(cheat ?sheet|formula|summary)/.test(n)) return 'Cheat Sheet'
  if (/(guide|revision)/.test(n)) return 'Study Guide'
  if (/(essay|report|project)/.test(n)) return 'Essay'
  if (/(slide|lecture|note)/.test(n) || types.includes('Notes') || /\.pptx?$/i.test(fileName)) return 'Lecture Notes'
  return 'Notes'
}

interface Path {
  college: string
  level: string
  semester: string
  deptSection: string
  dept: string
  course: string
}

async function driveList(parentId: string, apiKey: string): Promise<DriveFile[]> {
  const url = `${DRIVE_API}/files?key=${apiKey}&q=${encodeURIComponent(`'${parentId}' in parents`)}&fields=${DRIVE_FIELDS}&pageSize=1000`
  // A full-tree sync issues hundreds of Drive calls; a single transient
  // network blip must not abort it, so transient failures retry with backoff.
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error(`Drive API ${res.status}`)
      const data = (await res.json()) as { files?: DriveFile[] }
      return data.files || []
    } catch (err) {
      if (attempt === 2) throw err
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt))
    }
  }
}

// Concurrency-limited map over an array
async function pMap<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i]!)
    }
  })
  await Promise.all(workers)
  return results
}

function buildPaper(f: DriveFile, path: Path, types: string[]): CatalogueItem {
  const hash = hashString(f.id)
  const fileName = f.name
  const title = fileName.replace(/\.[^.]+$/, '')
  const courseName = path.course || path.dept || 'General'
  const courseInfo = parseCourseName(courseName)
  const subjectName = courseInfo.code
    ? CODE_SUBJECTS[courseInfo.code] || courseInfo.code
    : 'General Studies'
  const subject = courseInfo.code
    ? slugify(CODE_SUBJECTS[courseInfo.code] || courseInfo.code)
    : 'general'
  const sizeBytes = Number(f.size) || 0
  const type = detectType(fileName, types)
  const owner = f.owners?.[0]
  const contributor = owner?.emailAddress || 'anonymous'
  const contributorName = owner?.displayName || owner?.emailAddress?.split('@')[0] || 'Anonymous'
  return {
    id: f.id,
    title,
    subtitle: courseInfo.code ? `${courseInfo.code} ${courseInfo.number}` : courseName,
    subject,
    subjectName,
    course: path.course || path.dept || f.id,
    courseName,
    type,
    year: f.createdTime ? new Date(f.createdTime).getFullYear() : new Date().getFullYear(),
    pages: estimatePages(sizeBytes, hash),
    upvotes: 40 + (hash % 900),
    downvotes: hash % 40,
    downloads: 200 + ((hash >> 4) % 3000),
    views: 600 + ((hash >> 8) % 12000),
    contributor,
    contributorName,
    teacher: '',
    cover: hash % 16,
    mimeType: f.mimeType,
    fileExt: extFromName(fileName),
    sizeLabel: sizeBytes ? formatBytes(sizeBytes) : '—',
    previewUrl: `https://drive.google.com/file/d/${f.id}/preview`,
    // Key-free public Drive endpoint. The library tree is world-readable, so
    // this needs no API key — which is the point: the key used to be baked
    // into every row here and shipped to every client on every catalogue read.
    // Clients that want a keyed URL call the `files.downloadUrl` action, which
    // mints one at request time from the Convex env.
    downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
    createdAt: f.createdTime || new Date().toISOString(),
    parents: f.parents || [],
    college: path.college,
    program: courseInfo.code,
    level: courseInfo.number,
    levelYear: levelYearOf(courseInfo.number),
    semester: path.semester,
    deptSection: path.deptSection,
    license: DEFAULT_LICENSE,
    fileId: f.id,
  } satisfies CatalogueItem
}

// Recursively walk one dept section (or deeper course tree).
async function walk(
  folderId: string,
  path: Path,
  types: string[],
  apiKey: string,
): Promise<CatalogueItem[]> {
  const files = await driveList(folderId, apiKey)
  const subFolders = files.filter((f) => f.mimeType === 'application/vnd.google-apps.folder')
  const fileItems = files.filter(
    (f) => f.mimeType !== 'application/vnd.google-apps.folder' && MATERIAL_MIME.test(f.mimeType),
  )

  const here: CatalogueItem[] = fileItems.map((f) => buildPaper(f, path, types))
  const childResults = await pMap(subFolders, 6, async (sub) => {
    if (sub.name === 'Notes' || sub.name === 'Past Questions') {
      return walk(sub.id, path, [...types, sub.name], apiKey)
    }
    // Deeper course-level folders (e.g. department folder)
    const next = { ...path }
    if (path.deptSection === 'Departmental Courses' && !path.dept) {
      next.dept = sub.name
      next.course = ''
    } else if (!path.course) {
      next.course = sub.name
    } else {
      next.course = sub.name // nested course materials
    }
    return walk(sub.id, next, types, apiKey)
  })

  return [...here, ...childResults.flat()]
}

// Publish each level (100/200/300/400…) as its own subtree.
async function publishLevel(lvl: DriveFile, apiKey: string, college: string): Promise<CatalogueItem[]> {
  const path: Path = { college, level: lvl.name, semester: '', deptSection: '', dept: '', course: '' }
  const semesters = await driveList(lvl.id, apiKey)
  const semRes = await pMap(semesters, 4, async (sem) => {
    const semPath = { ...path, semester: sem.name }
    const sections = await driveList(sem.id, apiKey)
    const secRes = await pMap(sections, 4, async (sec) => {
      return walk(sec.id, { ...semPath, deptSection: sec.name }, [], apiKey)
    })
    return secRes.flat()
  })
  return semRes.flat()
}

// Validate the walk's output against the shared Zod schema before it is stored.
function toValidatedItems(items: CatalogueItem[]): CatalogueItem[] {
  const result = catalogueItemSchema.array().safeParse(items)
  if (!result.success) {
    throw new Error(`Catalogue walk produced invalid items: ${result.error.message}`)
  }
  return result.data
}

/**
 * Fingerprint of a walked Drive tree.
 *
 * Cheaply comparable: it hashes only the identity + content-bearing fields of
 * each paper, not the whole object, so an unrelated field change cannot fake a
 * difference and a rename cannot hide behind a reordering. The sync action
 * compares this against the last one it stored and skips the entire diff (a
 * full-table read plus N writes) when the tree is untouched.
 *
 * Sorting by id means Drive returning folders in a different order still hashes
 * identically.
 */
// Field and row separators for the fingerprint. Written as escapes rather than
// literal control characters so the source stays plain text (a raw NUL byte
// makes the file binary to grep and to most editors).
const FIELD_SEP = "\u0000";
const ROW_SEP = "\u0001";

export function hashCatalogueItems(items: CatalogueItem[]): string {
  const rows = items
    .map((item) =>
      [
        item.id,
        item.title,
        item.fileId,
        item.fileExt,
        item.course,
        item.courseName,
        item.level,
        item.levelYear,
        item.program,
        item.college,
        item.license,
        item.teacher,
        item.year,
        item.sizeLabel,
      ].join(FIELD_SEP),
    )
    .sort()
    .join(ROW_SEP);
  return contentHash(rows);
}

/**
 * 32-bit FNV-1a, doubled with a different offset basis. Non-cryptographic on
 * purpose: this only needs "did the tree change?", and `crypto.subtle` is not
 * available in the default Convex runtime.
 */
function contentHash(input: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b + c + i, 0x85ebca6b) >>> 0;
  }
  return `${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0)
    .toString(16)
    .padStart(8, "0")}${(input.length >>> 0).toString(16)}`;
}

/**
 * Walk the whole Drive tree and return validated catalogue items.
 * Called from the sync action with the server-side API key.
 */
export async function walkCatalogueTree(apiKey: string): Promise<CatalogueItem[]> {
  const colleges = await driveList(ROOT_FOLDER_ID, apiKey)
  const collegeResults = await pMap(colleges, 2, async (college) => {
    const levels = await driveList(college.id, apiKey)
    const levelResults = await pMap(levels, 3, async (lvl) => publishLevel(lvl, apiKey, college.name))
    return levelResults.flat()
  })
  const all = collegeResults.flat()
  // The same Drive file can be reachable from several colleges — keep the
  // first occurrence so the catalogue holds each paper exactly once.
  const seen = new Set<string>()
  const deduped = all.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  return toValidatedItems(deduped)
}
