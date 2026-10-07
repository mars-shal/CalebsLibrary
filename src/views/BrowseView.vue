<script setup lang="ts">
// Browse — cover-forward shelves. Ported from design_handoff Browse.jsx.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { PAPER_TYPES } from '@/script/design'
import type { Paper, Subject } from '@/script/design'
import PaperCard from '@/components/PaperCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'

const drive = useDriveStore()
const router = useRouter()

const subjectFilter = ref('all')
const typeFilter = ref('all')
const yearFilter = ref<'all' | number>('all')
const sortBy = ref<'dept' | 'course' | 'year-new' | 'year-old' | 'reads' | 'upvotes'>('dept')

// Render shelves in chunks and reveal more as the user scrolls (RENDER_CHUNK
// at a time) instead of painting all 719 papers' DOM at once.
const RENDER_CHUNK = 3
const MAX_BOOKS_PER_SHELF = 24
const revealed = ref(RENDER_CHUNK)
const sentinelEl = ref<HTMLElement | null>(null)

const TYPES = PAPER_TYPES

const visibleSubjects = computed<Subject[]>(() => {
  const list = drive.subjects.filter(
    (s) => subjectFilter.value === 'all' || s.id === subjectFilter.value,
  )
  return sortBy.value === 'dept'
    ? [...list].sort((a, b) => a.name.localeCompare(b.name))
    : list
})

const visibleTypes = computed<string[]>(() =>
  typeFilter.value === 'all' ? TYPES : [typeFilter.value],
)

const bySubject = computed(() => {
  const map: Record<string, Paper[]> = {}
  for (const s of visibleSubjects.value) {
    let list = drive.papersBySubject(s.id).filter(
      (p) =>
        visibleTypes.value.includes(p.type) &&
        (yearFilter.value === 'all' || p.year === yearFilter.value),
    )
    list = sortPapers(list)
    map[s.id] = list
  }
  return map
})

function sortPapers(list: Paper[]): Paper[] {
  switch (sortBy.value) {
    case 'course':
      return [...list].sort((a, b) => a.courseName.localeCompare(b.courseName))
    case 'year-new':
      return [...list].sort((a, b) => b.year - a.year || (a.createdAt < b.createdAt ? 1 : -1))
    case 'year-old':
      return [...list].sort((a, b) => a.year - b.year || (a.createdAt < b.createdAt ? 1 : -1))
    case 'reads':
      return [...list].sort((a, b) => b.views - a.views)
    case 'upvotes':
      return [...list].sort((a, b) => b.upvotes - a.upvotes)
    default:
      return [...list]
  }
}

const availableYears = computed<number[]>(() => {
  const years = new Set<number>()
  for (const s of visibleSubjects.value) {
    for (const p of drive.papersBySubject(s.id)) {
      if (visibleTypes.value.includes(p.type)) years.add(p.year)
    }
  }
  return [...years].sort((a, b) => b - a)
})

const totalCount = computed(() => Object.values(bySubject.value).reduce((n, arr) => n + arr.length, 0))

const anyResults = computed(() => totalCount.value > 0)

const isLoading = computed(() => drive.loading && drive.papers.length === 0)

function openPaper(p: Paper) {
  router.push({ name: 'paper', params: { id: p.id } })
}

let observer: IntersectionObserver | null = null

function revealMore(): void {
  if (revealed.value < visibleSubjects.value.length) {
    revealed.value += RENDER_CHUNK
  }
}

/**
 * The sentinel does double duty. It un-reveals another shelf of papers that are
 * already loaded, and — because the catalogue now arrives a page at a time —
 * asks for the next page when there are no more shelves left to reveal.
 *
 * `fetchMore` is a no-op while a request is in flight or the catalogue is
 * already complete, so the observer firing repeatedly is harmless.
 */
function onSentinel(): void {
  revealMore()
  if (revealed.value >= visibleSubjects.value.length) void drive.fetchMore()
}

// Browse shows the whole library, so it walks it by page rather than grabbing it
// all up front.
onMounted(() => void drive.fetchMore())

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    revealed.value = visibleSubjects.value.length
    void drive.fetchMore()
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onSentinel()
      }
    },
    { rootMargin: '600px 0px' },
  )
  if (sentinelEl.value) observer.observe(sentinelEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch([subjectFilter, typeFilter, yearFilter, sortBy], () => {
  revealed.value = RENDER_CHUNK
})

// availableYears derives from visibleSubjects, so a department whose years exclude
// the current yearFilter would otherwise strand the page on the bare
// "These shelves are empty" message. Resetting the year is the fix.
watch(subjectFilter, () => {
  yearFilter.value = 'all'
})
</script>

<template>
  <div class="screen-wrap browse">
    <!-- Header -->
    <div class="smallcaps" style="margin-bottom: 10px">The library</div>
    <h1 class="page-title">Everything, sorted by subject.</h1>
    <p class="page-sub">
      Hover a book to lift it. Click to open. Every paper was uploaded by someone who wanted the next
      reader to have an easier time.
    </p>

    <!-- Filter bar -->
    <div class="filter-bar">
      <label class="sr-only" for="f-dept">Filter by department</label>
      <select id="f-dept" v-model="subjectFilter" class="fselect dept-select">
        <option value="all">All departments</option>
        <option v-for="s in drive.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <label class="sr-only" for="f-type">Filter by paper type</label>
      <select id="f-type" v-model="typeFilter" class="fselect">
        <option value="all">All types</option>
        <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
      </select>

      <label class="sr-only" for="f-year">Filter by year</label>
      <select id="f-year" v-model="yearFilter" class="fselect">
        <option :value="'all'">All years</option>
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>

      <span class="mono count">{{ totalCount.toLocaleString() }} papers</span>

      <label class="sr-only" for="f-sort">Sort shelves</label>
      <select id="f-sort" v-model="sortBy" class="fselect sort-select">
        <option value="dept">Sort: Department</option>
        <option value="course">Sort: Course</option>
        <option value="year-new">Sort: Year (newest)</option>
        <option value="year-old">Sort: Year (oldest)</option>
        <option value="reads">Sort: Most read</option>
        <option value="upvotes">Sort: Most upvoted</option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="shelf-view">
      <section v-for="i in 4" :key="i" class="shelf-section">
        <div class="shelf-head">
          <div class="sk-line" style="width: 200px" />
        </div>
        <div class="shelf-books">
          <SkeletonCard v-for="j in 8" :key="j" size="sm" />
        </div>
        <div class="shelf-ink" />
      </section>
    </div>

    <!-- Empty state -->
    <div v-else-if="!anyResults" class="empty-state">
      <div class="empty-title">These shelves are empty</div>
      <div class="empty-sub">Try loosening your filters.</div>
    </div>

    <!-- Shelf view -->
    <div v-else class="shelf-view">
      <section
        v-for="s in visibleSubjects.slice(0, revealed)"
        :key="s.id"
        class="shelf-section"
      >
        <div v-if="bySubject[s.id]?.length" class="shelf-head">
          <button class="shelf-title" @click="router.push({ name: 'subject', params: { id: s.id } })">
            {{ s.name }}
          </button>
          <span class="mono-meta">{{ bySubject[s.id]!.length }} papers</span>
          <span class="shelf-spacer" />
          <button
            class="btn-ghost shelf-open"
            @click="router.push({ name: 'subject', params: { id: s.id } })"
          >
            Open department →
          </button>
        </div>
        <div v-if="bySubject[s.id]?.length" class="shelf-books">
          <div v-for="p in bySubject[s.id]!.slice(0, MAX_BOOKS_PER_SHELF)" :key="p.id" class="shelf-book">
            <PaperCard :paper="p" size="sm" @click="openPaper(p)" />
          </div>
        </div>
        <div v-if="bySubject[s.id]?.length" class="shelf-ink" />
        <div v-if="bySubject[s.id]?.length" class="shelf-shadow" />
      </section>
      <div ref="sentinelEl" class="shelf-sentinel" />
      <div v-if="revealed < visibleSubjects.length" class="shelf-more">
        Scroll to load more departments…
      </div>
      <div v-else-if="drive.fetchingMore" class="shelf-more">
        Loading more papers…
      </div>
    </div>
  </div>
</template>

<style scoped>
.browse {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 48px 32px;
}
.page-title {
  font-size: 44px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--ink-100);
  margin: 0;
}
.page-sub {
  font-size: 15px;
  color: var(--ink-70);
  margin: 14px 0 32px;
  max-width: 640px;
  line-height: 1.55;
}

/* Filter bar — one compact row of native selects plus the count */
.filter-bar {
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.fselect {
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-70);
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 5px 12px;
  cursor: pointer;
  max-width: 220px;
  text-overflow: ellipsis;
}
.fselect:hover {
  border-color: var(--rule-strong);
}
.fselect:focus {
  outline: none;
  border-color: var(--ink-40);
}
/* Department names run long ("Electrical / Electronics Engineering"), so this
   one gets more room than the rest. */
.dept-select {
  max-width: 280px;
  flex: 1 1 220px;
}
.sort-select {
  max-width: 170px;
}
.count {
  font-size: 11px;
  color: var(--ink-40);
  white-space: nowrap;
  margin-left: auto;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Empty state */
.empty-state {
  border: 1px dashed var(--rule-strong);
  border-radius: 8px;
  padding: 80px;
  text-align: center;
}
.empty-title {
  font-size: 22px;
  font-weight: 500;
  color: var(--ink-100);
  margin-bottom: 8px;
  letter-spacing: -0.015em;
}
.empty-sub {
  font-size: 14px;
  color: var(--ink-40);
}

/* Shelf view */
.shelf-view {
  display: flex;
  flex-direction: column;
  gap: 64px;
}
.shelf-section {
  position: relative;
}
.shelf-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 8px;
  gap: 16px;
  margin-bottom: 24px;
}
.sk-line {
  height: 22px;
  border-radius: 4px;
  background: var(--paper-3);
  position: relative;
  overflow: hidden;
}
.sk-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 20%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 80%
  );
  animation: sk-shimmer 1.6s var(--ease-in-out) infinite;
}
@keyframes sk-shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
.shelf-title {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--ink-100);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.shelf-title:hover {
  text-decoration: underline;
}
.shelf-spacer {
  flex: 1;
}
.shelf-open {
  font-size: 13px;
}
.shelf-books {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding-bottom: 24px;
}
.shelf-book {
  width: 132px;
}
.shelf-ink {
  height: 4px;
  background: var(--ink-100);
  box-shadow: var(--shadow-lifted);
}
.shelf-shadow {
  height: 24px;
  background: var(--shadow-gradient);
  margin-top: 2px;
}
.shelf-sentinel {
  height: 1px;
}
.shelf-more {
  text-align: center;
  padding: 16px 0;
  font-size: 13px;
  /* Fallback fill for engines without background-clip: text, where the
     -webkit-text-fill-color below would otherwise leave the label invisible. */
  color: var(--ink-40);
  animation: sk-shimmer-text 1.6s var(--ease-in-out) infinite;
  /* The highlight sweeps between two INK tokens rather than to transparent
     white. A white highlight is invisible on the #ffffff light page and only a
     faint smear on #121212; ink-40 -> ink-70 is a real tonal step in both
     themes (darkens on light, lightens on dark), so the sweep reads either way. */
  background: linear-gradient(
    100deg,
    var(--ink-40) 20%,
    var(--ink-70) 50%,
    var(--ink-40) 80%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
/* The highlight is painted THROUGH the text by background-clip, so it can only
   move via background-position. Running the block-level `sk-shimmer` translateX
   here slid this full-content-width element up to +/-100% of its own width off
   the right edge (1176px wide at 1440), which is what made the page
   intermittently horizontally scrollable. */
@keyframes sk-shimmer-text {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 640px) {
  .browse {
    padding: 32px 20px;
  }
  .page-title {
    font-size: 34px;
  }
  .page-sub {
    margin: 12px 0 24px;
  }
  .filter-bar {
    padding: 12px;
    gap: 10px;
    margin-bottom: 24px;
  }
  .count {
    margin-left: 0;
  }
  .empty-state {
    padding: 48px 20px;
  }
  .shelf-view {
    gap: 48px;
  }
  .shelf-book {
    width: 132px;
  }
  .shelf-head {
    gap: 12px;
  }
  .shelf-open {
    font-size: 12.5px;
  }
}
</style>
