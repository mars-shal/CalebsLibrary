<script setup lang="ts">
// Shelves — College → Program → Level → Papers drill-down.
// Modelled on the bells-notes BrowseView, but reading Caleb's Library's own
// catalogue through the drive store (there is no second fetch path here).
//
// The catalogue is paged: `drive.papers` holds only the first page until
// something asks for the rest, so every count on this screen would be wrong if
// it were derived before `ensureComplete()` settles. Hence the explicit ready
// flag — nothing below is rendered until the whole corpus is in hand.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import type { Paper } from '@/script/design'
import BookCover from '@/components/BookCover.vue'
import Icon from '@/components/Icon.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'

const drive = useDriveStore()
const router = useRouter()

// Papers without a program (149 of them in the current catalogue) still belong
// to a college, so they get their own branch instead of being dropped or
// folded into a real program.
const UNCATEGORISED = '__uncategorised__'
const UNCATEGORISED_LABEL = 'Uncategorised'

interface LevelNode {
  key: string
  /** Short form for the big numeral — '' for the level-less bucket. */
  num: string
  /** Screen-reader-friendly label, e.g. "Level 101". */
  label: string
  papers: Paper[]
}

interface ProgramNode {
  key: string
  /** Program code as it appears in the catalogue ("MTH"), or the fallback label. */
  code: string
  papers: Paper[]
  levels: LevelNode[]
}

interface CollegeNode {
  key: string
  /** Full catalogue string, e.g. "College of Computing (COLCOMP)". */
  label: string
  papers: Paper[]
  programs: ProgramNode[]
}

interface Breadcrumb {
  label: string
  /** null = the segment you are currently on. */
  to: (() => void) | null
}

const ready = ref(false)
const selectedCollege = ref<string | null>(null)
const selectedProgram = ref<string | null>(null)
const selectedLevel = ref<string | null>(null)

onMounted(async () => {
  await drive.ensureComplete()
  ready.value = true
})

const isLoading = computed(() => !ready.value || drive.loading)

// ---- the tree ---------------------------------------------------------------
// One pass over the loaded corpus. Every paper lands in exactly one leaf:
// program-less papers go to the Uncategorised program of their college, and
// papers with no level go to the level-less bucket of their program. Neither
// count is ever added to a real sibling.
const tree = computed<CollegeNode[]>(() => {
  type LevelDraft = { papers: Paper[] }
  type ProgramDraft = { papers: Paper[]; levels: Map<string, LevelDraft> }
  const colleges = new Map<string, { papers: Paper[]; programs: Map<string, ProgramDraft> }>()

  for (const p of drive.papers) {
    const collegeKey = p.college?.trim() || UNCATEGORISED
    const programKey = p.program?.trim() || UNCATEGORISED
    const levelKey = p.level?.trim() || UNCATEGORISED

    let college = colleges.get(collegeKey)
    if (!college) {
      college = { papers: [], programs: new Map() }
      colleges.set(collegeKey, college)
    }
    college.papers.push(p)

    let program = college.programs.get(programKey)
    if (!program) {
      program = { papers: [], levels: new Map() }
      college.programs.set(programKey, program)
    }
    program.papers.push(p)

    let level = program.levels.get(levelKey)
    if (!level) {
      level = { papers: [] }
      program.levels.set(levelKey, level)
    }
    level.papers.push(p)
  }

  const byCount = (a: number, b: number) => b - a
  const nodes: CollegeNode[] = []
  for (const [collegeKey, draft] of colleges) {
    const programs: ProgramNode[] = []
    for (const [programKey, pdraft] of draft.programs) {
      const levels: LevelNode[] = [...pdraft.levels.entries()].map(([key, l]) => ({
        key,
        num: key === UNCATEGORISED ? '' : key,
        label: key === UNCATEGORISED ? 'No level' : `Level ${key}`,
        papers: l.papers,
      }))
      levels.sort((a, b) => {
        const an = Number(a.num)
        const bn = Number(b.num)
        if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn
        return a.label.localeCompare(b.label)
      })
      programs.push({
        key: programKey,
        code: programKey === UNCATEGORISED ? UNCATEGORISED_LABEL : programKey,
        papers: pdraft.papers,
        levels,
      })
    }
    // Uncategorised always sinks to the bottom — it is the leftover, not a peer.
    programs.sort((a, b) => {
      if (a.key === UNCATEGORISED) return 1
      if (b.key === UNCATEGORISED) return -1
      return byCount(a.papers.length, b.papers.length) || a.code.localeCompare(b.code)
    })
    nodes.push({
      key: collegeKey,
      label: collegeKey === UNCATEGORISED ? UNCATEGORISED_LABEL : collegeKey,
      papers: draft.papers,
      programs,
    })
  }
  nodes.sort((a, b) => byCount(a.papers.length, b.papers.length) || a.label.localeCompare(b.label))
  return nodes
})

const currentCollege = computed<CollegeNode | null>(
  () => tree.value.find((c) => c.key === selectedCollege.value) ?? null,
)

const currentProgram = computed<ProgramNode | null>(
  () => currentCollege.value?.programs.find((p) => p.key === selectedProgram.value) ?? null,
)

const currentLevel = computed<LevelNode | null>(
  () => currentProgram.value?.levels.find((l) => l.key === selectedLevel.value) ?? null,
)

// The Uncategorised branch has no meaningful level to pick, so it goes straight
// to the papers it holds.
const atLeaf = computed(() => {
  if (!currentProgram.value) return false
  if (selectedLevel.value !== null) return true
  return currentProgram.value.key === UNCATEGORISED
})

const leafPapers = computed<Paper[]>(() => {
  const level = currentLevel.value
  if (level) return level.papers
  if (atLeaf.value && currentProgram.value) return currentProgram.value.papers
  return []
})

// ---- labels -----------------------------------------------------------------
function stripCode(collegeLabel: string): string {
  return collegeLabel.replace(/\s*\([^)]*\)\s*$/, '')
}

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`
}

const tierLabel = computed(() => {
  if (!currentCollege.value) return 'Choose a college'
  if (!currentProgram.value) return `Programs in ${stripCode(currentCollege.value.label)}`
  return 'Pick a level'
})

const tierIcon = computed(() => {
  if (!currentCollege.value) return 'compass'
  if (!currentProgram.value) return 'books'
  return 'trending'
})

// ---- navigation -------------------------------------------------------------
function selectCollege(key: string): void {
  selectedCollege.value = key
  selectedProgram.value = null
  selectedLevel.value = null
}

function selectProgram(key: string): void {
  selectedProgram.value = key
  selectedLevel.value = null
}

function selectLevel(key: string): void {
  selectedLevel.value = key
}

function goUpToCollege(): void {
  selectedCollege.value = null
  selectedProgram.value = null
  selectedLevel.value = null
}

function goUpToProgram(): void {
  selectedProgram.value = null
  selectedLevel.value = null
}

function goBack(): void {
  if (selectedLevel.value !== null) {
    selectedLevel.value = null
    return
  }
  if (selectedProgram.value !== null) {
    goUpToProgram()
    return
  }
  if (selectedCollege.value !== null) goUpToCollege()
}

const canGoBack = computed(() => selectedCollege.value !== null)

const breadcrumb = computed<Breadcrumb[]>(() => {
  const crumbs: Breadcrumb[] = []
  if (currentCollege.value) {
    crumbs.push({ label: currentCollege.value.label, to: goUpToCollege })
  }
  if (currentProgram.value) {
    crumbs.push({ label: currentProgram.value.code, to: goUpToProgram })
  }
  if (currentLevel.value) {
    crumbs.push({ label: currentLevel.value.label, to: null })
  }
  return crumbs
})

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
      <h1 class="shelves-title">Browse</h1>
    </header>

    <!-- Breadcrumb -->
    <nav v-if="breadcrumb.length" class="breadcrumb" aria-label="Breadcrumb">
      <button type="button" class="crumb crumb-link" @click="goUpToCollege">All</button>
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
      <!-- Papers (level 4) -->
      <section v-if="atLeaf" class="tier" :key="`leaf-${currentProgram?.key ?? ''}-${selectedLevel ?? ''}`">
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

      <section v-else class="tier" :key="`tier-${selectedCollege}-${selectedProgram}`">
        <div class="tier-label"><Icon :name="tierIcon" :size="13" /> {{ tierLabel }}</div>

        <!-- Level 1 — colleges -->
        <div v-if="!currentCollege" class="grid-3">
          <button
            v-for="(c, i) in tree"
            :key="c.key"
            type="button"
            class="node-card college-card rise"
            :style="{ '--stagger': `${Math.min(i, 12) * 40}ms` }"
            @click="selectCollege(c.key)"
          >
            <span class="node-icon"><Icon name="books" :size="18" /></span>
            <span class="node-body">
              <span class="node-title">{{ c.label }}</span>
              <span class="node-sub">{{ plural(c.papers.length, 'paper', 'papers') }}</span>
            </span>
            <Icon name="chevron" :size="15" class="node-arrow" />
          </button>
        </div>

        <!-- Level 2 — programs -->
        <div v-else-if="!currentProgram" class="grid-3">
          <button
            v-for="(p, i) in currentCollege.programs"
            :key="p.key"
            type="button"
            class="node-card program-card rise"
            :style="{ '--stagger': `${Math.min(i, 12) * 40}ms` }"
            :aria-label="
              p.key === UNCATEGORISED
                ? `${UNCATEGORISED_LABEL}, ${plural(p.papers.length, 'paper', 'papers')}`
                : `${p.code}, ${plural(p.levels.length, 'level', 'levels')}`
            "
            @click="selectProgram(p.key)"
          >
            <span class="node-icon"><Icon :name="p.key === UNCATEGORISED ? 'flag' : 'book'" :size="17" /></span>
            <span class="node-body">
              <span class="node-title mono">{{ p.code }}</span>
              <span class="node-sub">
                <template v-if="p.key === UNCATEGORISED">
                  {{ plural(p.papers.length, 'paper', 'papers') }} · no program
                </template>
                <template v-else>{{ plural(p.levels.length, 'level', 'levels') }}</template>
              </span>
            </span>
            <Icon name="chevron" :size="15" class="node-arrow" />
          </button>
        </div>

        <!-- Level 3 — levels -->
        <div v-else class="grid-3">
          <button
            v-for="(l, i) in currentProgram.levels"
            :key="l.key"
            type="button"
            class="level-card rise"
            :style="{ '--stagger': `${Math.min(i, 12) * 40}ms` }"
            :aria-label="`${l.label}, ${plural(l.papers.length, 'paper', 'papers')}`"
            @click="selectLevel(l.key)"
          >
            <span class="level-num">{{ l.num || '—' }}</span>
            <span class="level-label">{{ l.label }}</span>
            <span class="level-count mono">{{ l.papers.length.toLocaleString() }}</span>
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
  color: var(--paper);
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
