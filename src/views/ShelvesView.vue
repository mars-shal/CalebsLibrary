<script setup lang="ts">
// Shelves — College → Level → Department → Course → Papers drill-down.
// Modelled on the bells-notes BrowseView, but reading Caleb's Library's own
// catalogue through the drive store (there is no second fetch path here).
//
// The catalogue is paged: `drive.papers` holds only the first page until
// something asks for the rest, so every count on this screen would be wrong if
// it were derived before `ensureComplete()` settles. Hence the explicit ready
// flag — nothing below is rendered until the whole corpus is in hand.
//
// The shelves are a path, not a set of refs. `selected` holds one key per tier
// picked, from the root down, and everything on screen — the grid, the heading,
// the breadcrumb, Back — is derived by walking it. Adding a tier means adding a
// shelf-namer below, not rewriting the navigation around it.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import type { Paper } from '@/script/design'
import { CODE_SUBJECTS, LEVEL_DESC, parseCourseName } from '@/schema/catalogue'
import BookCover from '@/components/BookCover.vue'
import Icon from '@/components/Icon.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'

const drive = useDriveStore()
const router = useRouter()

// Papers with no college, level, program or course (149 of them in the current
// catalogue) still belong where they are, so they get their own branch instead
// of being dropped or folded into a real sibling.
const UNCATEGORISED = '__uncategorised__'
const UNCATEGORISED_LABEL = 'Uncategorised'

interface Breadcrumb {
  label: string
  /** null = the segment you are currently on. */
  to: (() => void) | null
}

/** One shelf. Every tier has this shape, so the template draws them alike. */
interface Shelf {
  key: string
  label: string
  /** The quieter second line — a paper count, or how many shelves sit below. */
  sub: string
  count: number
  icon: string
  /** The oversized numeral on a level card; empty on every other tier. */
  num: string
  /** Which tier it sits on: 0 colleges, 1 levels, 2 departments, 3 courses. */
  tier: number
  /** The tier below this one. Empty only on the papers themselves. */
  kids: Shelf[]
  papers: Paper[]
}

/** What a tier needs to name one of its shelves. */
interface ShelfText {
  label: string
  sub: string
  icon: string
  num: string
}

interface ShelfDraft {
  key: string
  count: number
  kids: Shelf[]
  /** Raw course names folded into this shelf, with counts. */
  spellings: Map<string, number>
}

interface Tier {
  /** What the tier is called in the heading above the grid. */
  noun: string
  icon: string
  name: (draft: ShelfDraft) => ShelfText
  sort: (a: Shelf, b: Shelf) => number
}

const ready = ref(false)
const selected = ref<string[]>([])

onMounted(async () => {
  await drive.ensureComplete()
  ready.value = true
})

const isLoading = computed(() => !ready.value || drive.loading)

// ---- labels -----------------------------------------------------------------
function stripCode(collegeLabel: string): string {
  return collegeLabel.replace(/\s*\([^)]*\)\s*$/, '')
}

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`
}

function collegeShelf({ key, count }: ShelfDraft): ShelfText {
  return {
    label: key === UNCATEGORISED ? UNCATEGORISED_LABEL : stripCode(key),
    sub: plural(count, 'paper', 'papers'),
    icon: 'books',
    num: '',
  }
}

function levelShelf({ key, count }: ShelfDraft): ShelfText {
  return {
    // LevelDesc covers '1'–'5', but only the years the catalogue actually holds
    // are ever built, so there are no dead cards for a level with no papers.
    label: key === UNCATEGORISED ? 'No level' : LEVEL_DESC[key] || `Level ${key}`,
    sub: plural(count, 'paper', 'papers'),
    icon: 'trending',
    num: key === UNCATEGORISED ? '' : key,
  }
}

function departmentShelf({ key, count, kids }: ShelfDraft): ShelfText {
  return {
    label: key === UNCATEGORISED ? UNCATEGORISED_LABEL : CODE_SUBJECTS[key] || key,
    sub:
      key === UNCATEGORISED
        ? `${plural(count, 'paper', 'papers')} · no program`
        : plural(kids.length, 'course', 'courses'),
    icon: key === UNCATEGORISED ? 'flag' : 'book',
    num: '',
  }
}

function courseShelf({ key, count, spellings }: ShelfDraft): ShelfText {
  return {
    label: key === UNCATEGORISED ? UNCATEGORISED_LABEL : courseLabel(spellings),
    sub: plural(count, 'paper', 'papers'),
    icon: key === UNCATEGORISED ? 'flag' : 'file',
    num: '',
  }
}

/**
 * A shelf can collect several spellings of one course — the key is folded, so
 * "Arc 205" and "ARC 205" are the same shelf. Name it after the spelling the
 * folder itself uses, not after whichever one the sort happened to surface.
 */
function courseLabel(spellings: Map<string, number>): string {
  let label = ''
  let best = 0
  for (const [name, count] of spellings) {
    if (count > best) {
      label = name
      best = count
    }
  }
  const info = parseCourseName(label)
  // Not a course folder at all ("Project Gate house", "2022-23"), or one the
  // catalogue merged ("GST 208,GST 212,GST 312"). Show it as it stands.
  if (!info.code) return label
  if (!info.parenthetical) return `${info.code} ${info.number}`
  return `${info.code} ${info.number} — ${info.parenthetical}`
}

// ---- the tree ---------------------------------------------------------------
// Largest shelf first, ties broken by name. The Uncategorised shelf always sinks:
// it is the leftover, not a peer.
function byShelf(a: Shelf, b: Shelf): number {
  if (a.key === UNCATEGORISED) return 1
  if (b.key === UNCATEGORISED) return -1
  return b.count - a.count || a.label.localeCompare(b.label)
}

// Levels run in academic order rather than by size. Number('') is 0 and counts
// as finite, so the level-less shelf is matched out of the numeric branch and
// sunk like every other fallback — otherwise it would open the shelf, above
// Foundation.
function byLevel(a: Shelf, b: Shelf): number {
  if (a.key === UNCATEGORISED) return 1
  if (b.key === UNCATEGORISED) return -1
  const an = Number(a.key)
  const bn = Number(b.key)
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn
  return a.label.localeCompare(b.label)
}

// The tiers, in tree order. A fifth shelf is a fifth entry here plus a fifth key
// in `shelfKeys`; nothing below has to move.
const TIERS: Tier[] = [
  { noun: 'Colleges', icon: 'compass', name: collegeShelf, sort: byShelf },
  { noun: 'Levels', icon: 'trending', name: levelShelf, sort: byLevel },
  { noun: 'Departments', icon: 'book', name: departmentShelf, sort: byShelf },
  { noun: 'Courses', icon: 'file', name: courseShelf, sort: byShelf },
]

/** The course tier — the papers hang off it. */
const COURSE_TIER = TIERS.length - 1

/**
 * The shelves one paper belongs on, root first.
 *
 * The level is `levelYear`, not `level`: `level` holds the course number
 * ("312"), which is a course axis, and `levelYear` its leading digit is the
 * academic tier this shelf is sorted by.
 *
 * The course is keyed on `courseName`, never on `course`. The schema calls
 * `course` a Drive folder id, and in 8 of 1,276 papers it is one — the "General"
 * folder in COLENG carries eight distinct ids, so keying on it would shatter
 * that one course into eight single-paper shelves. The name is folded so that
 * names differing only by case or whitespace share a shelf; the label keeps the
 * most common original spelling.
 */
function shelfKeys(p: Paper): string[] {
  return [
    p.college?.trim() || UNCATEGORISED,
    p.levelYear?.trim() || UNCATEGORISED,
    p.program?.trim() || UNCATEGORISED,
    p.courseName.trim().replace(/\s+/g, ' ').toLowerCase() || UNCATEGORISED,
  ]
}

// One pass over the loaded corpus. Every paper is pushed into exactly one course
// shelf, so the course shelves hold the catalogue between them — 1,276 in,
// 1,276 out, with nothing merged away.
const tree = computed<Shelf[]>(() => {
  const root = new Map<string, Branch>()
  for (const p of drive.papers) buildBranch(root, shelfKeys(p), p)
  return shelves(root, 0)
})

/** A working node, before the labels and the sort order are attached. */
interface Branch {
  papers: Paper[]
  kids: Map<string, Branch>
  spellings: Map<string, number>
}

function buildBranch(level: Map<string, Branch>, keys: string[], paper: Paper): void {
  let here = level
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]!
    let node = here.get(key)
    if (!node) {
      node = { papers: [], kids: new Map(), spellings: new Map() }
      here.set(key, node)
    }
    if (i === keys.length - 1) {
      node.papers.push(paper)
      const raw = paper.courseName.trim().replace(/\s+/g, ' ')
      node.spellings.set(raw, (node.spellings.get(raw) ?? 0) + 1)
    }
    here = node.kids
  }
}

function shelves(level: Map<string, Branch>, depth: number): Shelf[] {
  const tier = TIERS[depth]
  const nodes: Shelf[] = []
  for (const [key, node] of level) {
    const kids = depth + 1 < TIERS.length ? shelves(node.kids, depth + 1) : []
    // Only a course holds papers of its own; every tier above it counts its
    // whole subtree, so a college's number is every paper filed beneath it.
    const count = node.papers.length + kids.reduce((sum, k) => sum + k.count, 0)
    const text = tier ? tier.name({ key, count, kids, spellings: node.spellings }) : null
    nodes.push({
      key,
      label: text?.label ?? key,
      sub: text?.sub ?? '',
      count,
      icon: text?.icon ?? 'books',
      num: text?.num ?? '',
      tier: depth,
      kids,
      papers: node.papers,
    })
  }
  const sort = tier?.sort
  if (sort) nodes.sort(sort)
  return nodes
}

// ---- navigation -------------------------------------------------------------
/**
 * Walk the tree along `keys`, one key per tier, and return the shelves landed on.
 *
 * A tier holding exactly one shelf is not a choice, so the walk steps through it
 * without spending a key: "No level" always has the one department Uncategorised
 * under it, and COLMANS runs one level, one department and one course deep.
 * Asking for those clicks before six papers is asking for nothing, so COLMANS
 * lands on its papers in one. The three-tier view skipped the level shelf for the
 * Uncategorised programme for the same reason — a boolean could only skip that
 * one case, whereas this falls out of the walk.
 *
 * A key that no longer resolves — a catalogue that moved under us — truncates
 * the path instead of throwing.
 */
function walk(keys: string[]): Shelf[] {
  const nodes: Shelf[] = []
  let level = tree.value
  for (const key of keys) {
    const node = level.find((n) => n.key === key)
    if (!node) break
    nodes.push(node)
    level = node.kids
    let stepped: Shelf = node
    while (stepped.tier < COURSE_TIER && stepped.kids.length === 1) {
      const only = stepped.kids[0]
      if (!only) break
      nodes.push(only)
      level = only.kids
      stepped = only
    }
  }
  return nodes
}

const trail = computed<Shelf[]>(() => walk(selected.value))

/** How many tiers the path runs through — also the next key's position. */
const depth = computed(() => trail.value.length)

const shelf = computed<Shelf | null>(() => trail.value[depth.value - 1] ?? null)

/** Which tier the grid is drawing — 0 at the root, 3 for the course grid. */
const tierIndex = computed(() => Math.min((shelf.value?.tier ?? -1) + 1, COURSE_TIER))

const atLeaf = computed(() => shelf.value?.tier === COURSE_TIER)

/** The shelves on offer at the tier being drawn. */
const children = computed<Shelf[]>(() => shelf.value?.kids ?? tree.value)

const leafPapers = computed<Paper[]>(() => shelf.value?.papers ?? [])

// A click extends the path — the grid only ever offers children of the deepest
// shelf on it. Truncating is what Back and the breadcrumb are for.
function select(key: string): void {
  selected.value = [...selected.value, key]
}

function goBack(): void {
  // A tier the walk stepped through on its own is not a place to stop: backing
  // out of COLMANS's papers should return to the colleges, not to the one
  // Uncategorised card it never asked for.
  let end = depth.value
  while (end > 1 && trail.value[end - 2]?.kids.length === 1) end -= 1
  selected.value = selected.value.slice(0, end - 1)
}

function goToDepth(target: number): void {
  selected.value = selected.value.slice(0, target)
}

const canGoBack = computed(() => selected.value.length > 0)

const breadcrumb = computed<Breadcrumb[]>(() => {
  const nodes = trail.value
  return nodes
    .map((node, i) => ({ node, i }))
    // A tier the walk stepped through was never picked, so it gets no crumb.
    .filter(({ i }) => i === 0 || nodes[i - 1]?.kids.length !== 1)
    .map(({ node, i }) => ({
      label: node.label,
      to: i === nodes.length - 1 ? null : () => goToDepth(i + 1),
    }))
})

const tierLabel = computed(() => {
  if (tierIndex.value === 0) return 'Choose a college'
  const noun = TIERS[tierIndex.value]?.noun ?? 'Shelves'
  // The deepest shelf actually picked — a skipped tier has no crumb of its own.
  const parent = breadcrumb.value[breadcrumb.value.length - 1]
  return parent ? `${noun} in ${parent.label}` : noun
})

const tierIcon = computed(() => TIERS[tierIndex.value]?.icon ?? 'books')

/** The level shelf keeps its oversized numeral; the rest share the node card. */
function nodeClass(tier: number): string {
  if (tier === 1) return 'level-card'
  return ['node-card', tier === 0 ? 'college-card' : tier === 2 ? 'program-card' : 'course-card'].join(' ')
}

// Re-keyed on every step so the tier and its cards replay their entrance.
const pathKey = computed(() => JSON.stringify(selected.value))

function openPaper(p: Paper): void {
  router.push({ name: 'paper', params: { id: p.id } })
}

function paperMeta(p: Paper): string[] {
  return [p.type, String(p.year), p.courseName || p.subjectName].filter(Boolean)
}

// While the store still holds a page rather than the whole corpus, say so —
// a college count that silently covers 5 papers is worse than a caveat.
const partialWarning = computed(() => {
  if (isLoading.value || drive.error) return ''
  if (drive.complete || !drive.total) return ''
  if (drive.papers.length >= drive.total) return ''
  return `Showing the first ${drive.papers.length.toLocaleString()} of ${drive.total.toLocaleString()} papers.`
})
</script>

<template>
  <div class="screen-wrap shelves">
    <!-- Header -->
    <header class="shelves-header">
      <button v-if="canGoBack" type="button" class="back-btn" @click="goBack">
        <Icon name="chevron" :size="15" class="back-icon" />
        <span>Back</span>
      </button>
      <h1 class="shelves-title">Shelves</h1>
    </header>

    <!-- Breadcrumb -->
    <nav v-if="breadcrumb.length" class="breadcrumb" aria-label="Breadcrumb">
      <button type="button" class="crumb crumb-link" @click="goToDepth(0)">All</button>
      <template v-for="(c, i) in breadcrumb" :key="`${c.label}-${i}`">
        <Icon name="chevron" :size="11" class="crumb-sep" />
        <button v-if="c.to" type="button" class="crumb crumb-link" @click="c.to">{{ c.label }}</button>
        <span v-else class="crumb crumb-current" aria-current="page">{{ c.label }}</span>
      </template>
    </nav>

    <div v-if="partialWarning" class="notice mono-meta">{{ partialWarning }}</div>

    <!-- Loading -->
    <div v-if="isLoading" class="tier">
      <div class="tier-label"><Icon name="compass" :size="13" /> Choose a college</div>
      <div class="grid-3">
        <SkeletonCard v-for="i in 6" :key="i" size="sm" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="drive.error && !drive.papers.length" class="empty-box">
      <p class="empty-title">The catalogue did not load.</p>
      <p class="empty-sub">{{ drive.error }}</p>
      <button type="button" class="btn btn-secondary" @click="drive.refresh()">Try again</button>
    </div>

    <!-- Empty catalogue -->
    <div v-else-if="!tree.length" class="empty-box">
      <p class="empty-title">No shelves yet.</p>
      <p class="empty-sub">Nothing has been catalogued so far.</p>
    </div>

    <template v-else>
      <!-- The papers — the bottom of the tree -->
      <section v-if="atLeaf" class="tier" :key="`leaf-${pathKey}`">
        <div class="tier-label">
          <Icon name="file" :size="13" />
          {{ plural(leafPapers.length, 'paper', 'papers') }}
        </div>
        <div v-if="leafPapers.length" class="papers-list">
          <button
            v-for="(p, i) in leafPapers"
            :key="p.id"
            type="button"
            class="paper-row rise"
            :style="{ '--stagger': `${Math.min(i, 12) * 26}ms` }"
            @click="openPaper(p)"
          >
            <BookCover :paper="p" size="xs" />
            <span class="paper-info">
              <span class="paper-title">{{ p.title }}</span>
              <span class="paper-meta">
                <template v-for="(part, j) in paperMeta(p)" :key="`${part}-${j}`">
                  <span v-if="j > 0" class="dot">·</span>
                  <span>{{ part }}</span>
                </template>
              </span>
            </span>
            <Icon name="chevron" :size="15" class="row-arrow" />
          </button>
        </div>
        <div v-else class="empty-box small">
          <p class="empty-sub">No papers at this level yet.</p>
        </div>
      </section>

      <!-- The shelves on offer, whatever tier we are on -->
      <section v-else class="tier" :key="`tier-${pathKey}`">
        <div class="tier-label"><Icon :name="tierIcon" :size="13" /> {{ tierLabel }}</div>

        <div class="grid-3">
          <button
            v-for="(node, i) in children"
            :key="node.key"
            type="button"
            :class="[nodeClass(tierIndex), 'rise']"
            :style="{ '--stagger': `${Math.min(i, 12) * 40}ms` }"
            :aria-label="`${node.label}, ${node.sub}`"
            @click="select(node.key)"
          >
            <template v-if="tierIndex === 1">
              <span class="level-num">{{ node.num || '—' }}</span>
              <span class="level-label">{{ node.label }}</span>
              <span class="level-count mono">{{ node.count.toLocaleString() }}</span>
            </template>
            <template v-else>
              <span class="node-icon"><Icon :name="node.icon" :size="18" /></span>
              <span class="node-body">
                <span class="node-title">{{ node.label }}</span>
                <span class="node-sub">{{ node.sub }}</span>
              </span>
              <Icon name="chevron" :size="15" class="node-arrow" />
            </template>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.shelves {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-6) var(--sp-8);
}

/* Header */
.shelves-header {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-bottom: var(--sp-2);
}
.shelves-title {
  /* tokens.css uppercases every h1/h2 at weight 900 — this one reads as a
     page title, so it opts out of the transform. */
  text-transform: none;
  font-weight: var(--weight-bold);
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-tertiary);
  transition:
    color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}
.back-btn:hover {
  color: var(--text-primary);
  background: var(--paper-2);
}
/* chevron points right by default; the back control wants the other way. */
.back-icon {
  transform: rotate(180deg);
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: var(--sp-1);
  gap: var(--sp-2);
  margin-bottom: var(--sp-6);
  font-size: var(--text-sm);
}
.crumb {
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--r-sm);
  font-size: var(--text-sm);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.crumb-link {
  color: var(--text-secondary);
  transition:
    color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}
.crumb-link:hover {
  color: var(--text-primary);
  background: var(--paper-2);
}
.crumb-current {
  color: var(--text-primary);
  font-weight: 500;
}
.crumb-sep {
  color: var(--text-quiet);
  flex-shrink: 0;
}

.notice {
  margin: calc(var(--sp-3) * -1) 0 var(--sp-5);
  padding: var(--sp-2) var(--sp-3);
  border: var(--hairline);
  border-radius: var(--r-md);
  background: var(--paper-2);
  color: var(--text-tertiary);
}

/* Tier scaffolding */
.tier {
  animation: tier-in var(--dur-slow) var(--ease-out) both;
}
.tier-label {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: var(--sp-4);
}
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-3);
}
/* Staggered card entrance — the same rise the home bento uses */
.rise {
  animation: rise-in var(--dur-slow) var(--ease-out) both;
  animation-delay: var(--stagger, 0ms);
}
@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes tier-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Node cards (colleges, programs) */
.node-card {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  text-align: left;
  min-width: 0;
  background: var(--material);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-focus);
  transition:
    transform var(--dur-fast) var(--ease-spring),
    box-shadow var(--dur-med) var(--ease-out);
}
.node-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: var(--shadow-book);
}
.node-card:active {
  transform: scale(0.98);
}
.node-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--r-lg);
  background: var(--paper-2);
  color: var(--text-primary);
}
.program-card .node-icon {
  width: 38px;
  height: 38px;
}
.node-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.node-title {
  font-size: var(--text-md);
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
.program-card .node-title {
  font-size: var(--text-base);
  letter-spacing: 0.06em;
}
.node-sub {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
/* Course cards carry a code and a title ("GET 207 — Applied Mechanics"), so
   they run longer than a department name and want the smaller icon box. */
.course-card .node-icon {
  width: 38px;
  height: 38px;
}
.course-card .node-title {
  font-size: var(--text-base);
  line-height: 1.3;
}
.node-arrow {
  flex-shrink: 0;
  color: var(--text-quiet);
  transition:
    transform var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}
.node-card:hover .node-arrow {
  transform: translateX(3px);
  color: var(--text-primary);
}

/* Level cards — oversized numeral, inverts on hover */
.level-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  padding: var(--sp-5) var(--sp-4);
  min-width: 0;
  background: var(--material);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-focus);
  transition:
    transform var(--dur-fast) var(--ease-spring),
    background-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-med) var(--ease-out);
}
.level-card:hover {
  /* --surface-dark is a dark surface in both themes, so the inversion reads
     the same on the white page and on the near-black one. */
  background: var(--surface-dark);
  transform: translateY(-3px);
  box-shadow: var(--shadow-book);
}
.level-card:active {
  transform: scale(0.97);
}
.level-num {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--text-primary);
  transition: color var(--dur-fast) var(--ease-out);
}
.level-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
  color: var(--text-tertiary);
  transition: color var(--dur-fast) var(--ease-out);
}
.level-count {
  color: var(--text-quiet);
  transition: color var(--dur-fast) var(--ease-out);
}
.level-card:hover .level-num,
.level-card:hover .level-label,
.level-card:hover .level-count {
  /* --surface-dark is dark in BOTH themes, so the foreground must be the
     on-surface token (light in dark mode) — --paper is #121212 there and
     would land at 1.2:1 against --surface-dark #232326. */
  color: var(--on-surface);
}
.level-card:hover .level-label {
  opacity: 0.75;
}

/* Papers list (level 4) */
.papers-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.paper-row {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-3);
  text-align: left;
  border-radius: var(--r-md);
  transition:
    background-color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.paper-row:hover {
  background: var(--paper-2);
  transform: translateX(2px);
}
.paper-row:hover .row-arrow {
  transform: translateX(3px);
  color: var(--text-primary);
}
.paper-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.paper-title {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.paper-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
.dot {
  opacity: 0.4;
}
.row-arrow {
  flex-shrink: 0;
  color: var(--text-quiet);
  transition:
    transform var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

/* Empty / error */
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-8) var(--sp-5);
  text-align: center;
  border: 1px dashed var(--rule-strong);
  border-radius: var(--r-lg);
  background: var(--paper-2);
}
.empty-box.small {
  padding: var(--sp-7) var(--sp-5);
}
.empty-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--text-primary);
}
.empty-sub {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

@media (max-width: 960px) {
  .grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .shelves {
    padding: var(--sp-5) var(--sp-5) var(--sp-7);
  }
  .grid-3 {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
  }
  .college-card {
    padding: var(--sp-3) var(--sp-4);
    gap: var(--sp-3);
  }
  .college-card .node-icon {
    width: 34px;
    height: 34px;
  }
  .level-num {
    font-size: var(--text-xl);
  }
  .level-card {
    padding: var(--sp-4);
  }
  .paper-row {
    gap: var(--sp-3);
    padding: var(--sp-2);
  }
  .row-arrow {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rise,
  .tier {
    animation: none;
  }
  .node-card:hover,
  .level-card:hover,
  .paper-row:hover {
    transform: none;
  }
}
</style>
