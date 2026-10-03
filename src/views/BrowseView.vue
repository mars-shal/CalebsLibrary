<script setup lang="ts">
// Browse — cover-forward shelves. Ported from design_handoff Browse.jsx.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { PAPER_TYPES } from '@/script/design'
import type { Paper, Subject } from '@/script/design'
import Icon from '@/components/Icon.vue'
import PaperCard from '@/components/PaperCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'

const drive = useDriveStore()
const router = useRouter()

const subjectFilter = ref('all')
const typeFilter = ref('all')
const courseFilter = ref('all')
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
        (courseFilter.value === 'all' || p.course === courseFilter.value) &&
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

// Dropdown options sized to the currently-filtered set.
const availableCourses = computed(() =>
  drive.courses.filter(
    (c) => subjectFilter.value === 'all' || c.subjectId === subjectFilter.value,
  ),
)

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

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    revealed.value = visibleSubjects.value.length
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) revealMore()
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

watch([subjectFilter, typeFilter, courseFilter, yearFilter, sortBy], () => {
  revealed.value = RENDER_CHUNK
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
      <div class="filter-left">
        <Icon name="filter" :size="14" class="filter-icon" />
        <span class="smallcaps filter-label">Filter</span>
        <div class="pills">
          <button
            class="fpill"
            :class="{ active: subjectFilter === 'all' }"
            @click="subjectFilter = 'all'"
          >
            All departments
          </button>
          <button
            v-for="s in drive.subjects"
            :key="s.id"
            class="fpill"
            :class="{ active: subjectFilter === s.id }"
            @click="subjectFilter = s.id"
          >
            {{ s.name }}
          </button>
        </div>
        <div class="divider" />
        <select
          v-model="courseFilter"
          class="fselect"
          title="Filter by course"
        >
          <option value="all">All courses</option>
          <option v-for="c in availableCourses" :key="c.id" :value="c.id">
            {{ c.displayName || c.name }}
          </option>
        </select>
        <div class="divider" />
        <div class="pills">
          <button
            class="fpill"
            :class="{ active: typeFilter === 'all' }"
            @click="typeFilter = 'all'"
          >
            All types
          </button>
          <button
            v-for="t in TYPES"
            :key="t"
            class="fpill"
            :class="{ active: typeFilter === t }"
            @click="typeFilter = t"
          >
            {{ t }}
          </button>
        </div>
        <div class="divider" />
        <select
          v-model="yearFilter"
          class="fselect"
          title="Filter by year"
        >
          <option :value="'all'">All years</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div class="filter-right">
        <span class="mono count">{{ totalCount.toLocaleString() }} papers</span>
        <select v-model="sortBy" class="fselect sort-select" title="Sort shelves">
          <option value="dept">Sort: Department</option>
          <option value="course">Sort: Course</option>
          <option value="year-new">Sort: Year (newest)</option>
          <option value="year-old">Sort: Year (oldest)</option>
          <option value="reads">Sort: Most read</option>
          <option value="upvotes">Sort: Most upvoted</option>
        </select>
      </div>
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

/* Filter bar */
.filter-bar {
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 48px;
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
}
.fselect:hover {
  border-color: var(--rule-strong);
}
.fselect:focus {
  outline: none;
  border-color: var(--ink-40);
}
.sort-select {
  max-width: 180px;
}
.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-icon {
  color: var(--ink-40);
}
.filter-label {
  font-size: 10px;
}
.pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.fpill {
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-70);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.fpill:hover {
  background: var(--paper-2);
  color: var(--ink-100);
}
.fpill.active {
  background: var(--ink-100);
  color: var(--paper);
}
.divider {
  width: 1px;
  height: 20px;
  background: var(--rule);
}
.filter-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.count {
  font-size: 11px;
  color: var(--ink-40);
  white-space: nowrap;
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
  color: var(--ink-40);
  animation: sk-shimmer 1.6s var(--ease-in-out) infinite;
  background: linear-gradient(
    100deg,
    transparent 20%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 80%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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
    margin-bottom: 32px;
  }
  .filter-right {
    width: 100%;
    justify-content: space-between;
  }
  .divider {
    display: none;
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
