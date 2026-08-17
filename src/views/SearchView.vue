<script setup lang="ts">
// Search — full-facet search with highlighted matches. Ported from Search.jsx.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchAutocomplete } from '@/composables/useSearchAutocomplete'
import { useDriveStore } from '@/stores/drive'
import { formatCount } from '@/script/design'
import type { Paper } from '@/script/design'
import Icon from '@/components/Icon.vue'
import BookCover from '@/components/BookCover.vue'
import Avatar from '@/components/Avatar.vue'

const drive = useDriveStore()
const route = useRoute()
const router = useRouter()
const {
  query,
  suggestions,
  showDropdown,
  highlightedIndex,
  selectSuggestion,
  handleKeydown,
  containerRef,
  onInput,
} = useSearchAutocomplete()

query.value = typeof route.query.q === 'string' ? route.query.q : ''
watch(
  () => route.query.q,
  (q) => {
    query.value = typeof q === 'string' ? q : ''
  },
)

const selSubjects = ref<string[]>([])
const selTypes = ref<string[]>([])
const sort = ref<'relevance' | 'newest' | 'votes' | 'downloads'>('relevance')
const showFacets = ref(false)

const yearBounds = computed(() => {
  const years = drive.papers.map((p) => p.year)
  const min = years.length ? Math.min(...years) : 2020
  const max = years.length ? Math.max(...years) : 2026
  return { min, max }
})
const yearMin = ref(yearBounds.value.min)
const yearMax = ref(yearBounds.value.max)

watch(
  () => yearBounds.value,
  (b) => {
    if (yearMin.value < b.min) yearMin.value = b.min
    if (yearMax.value > b.max) yearMax.value = b.max
  },
)

const results = computed<Paper[]>(() => {
  let list = drive.search(query.value, {
    subjects: selSubjects.value.length ? selSubjects.value : undefined,
    types: selTypes.value.length ? selTypes.value : undefined,
    yearMin: yearMin.value,
    yearMax: yearMax.value,
  })
  if (sort.value === 'newest') list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  else if (sort.value === 'votes') list = [...list].sort((a, b) => b.upvotes - a.upvotes)
  else if (sort.value === 'downloads') list = [...list].sort((a, b) => b.downloads - a.downloads)
  return list
})

const PAGE = 10
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(results.value.length / PAGE)))
const pageResults = computed(() => results.value.slice((page.value - 1) * PAGE, page.value * PAGE))

watch([selSubjects, selTypes, sort, query], () => {
  page.value = 1
})

const SORTS: { id: typeof sort.value; label: string }[] = [
  { id: 'relevance', label: 'Most relevant' },
  { id: 'newest', label: 'Newest' },
  { id: 'votes', label: 'Most upvoted' },
  { id: 'downloads', label: 'Most downloaded' },
]

function toggleSubject(id: string) {
  selSubjects.value = selSubjects.value.includes(id)
    ? selSubjects.value.filter((s) => s !== id)
    : [...selSubjects.value, id]
}
function toggleType(t: string) {
  selTypes.value = selTypes.value.includes(t)
    ? selTypes.value.filter((x) => x !== t)
    : [...selTypes.value, t]
}
function resetFilters() {
  selSubjects.value = []
  selTypes.value = []
  yearMin.value = yearBounds.value.min
  yearMax.value = yearBounds.value.max
}

function setYearMin(v: number) {
  yearMin.value = Math.min(v, yearMax.value)
}
function setYearMax(v: number) {
  yearMax.value = Math.max(v, yearMin.value)
}

// Split a string on the query (case-insensitive) into highlight segments
function segments(text: string): { text: string; hit: boolean }[] {
  const q = query.value.trim().toLowerCase()
  if (!q) return [{ text, hit: false }]
  const out: { text: string; hit: boolean }[] = []
  let rest = text
  let idx = rest.toLowerCase().indexOf(q)
  while (idx !== -1) {
    if (idx > 0) out.push({ text: rest.slice(0, idx), hit: false })
    out.push({ text: rest.slice(idx, idx + q.length), hit: true })
    rest = rest.slice(idx + q.length)
    idx = rest.toLowerCase().indexOf(q)
  }
  if (rest) out.push({ text: rest, hit: false })
  return out
}

const visiblePages = computed<number[]>(() => {
  const total = pageCount.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: number[] = []
  const first = Math.max(1, page.value - 2)
  const last = Math.min(total, first + 4)
  for (let i = first; i <= last; i++) pages.push(i)
  return pages
})

function openPaper(p: Paper) {
  router.push({ name: 'paper', params: { id: p.id } })
}

function handleBlur(): void {
  window.setTimeout(() => {
    showDropdown.value = false
    highlightedIndex.value = -1
  }, 120)
}
</script>

<template>
  <div class="screen-wrap search">
    <!-- Query header -->
    <div class="smallcaps" style="margin-bottom: 12px">Search</div>
    <div ref="containerRef" class="big-search">
      <Icon name="search" :size="20" class="big-search-icon" />
      <input
        v-model="query"
        class="big-search-input"
        type="text"
        autocomplete="off"
        placeholder="Search the library…"
        @input="onInput"
        @keydown="handleKeydown"
        @focus="onInput"
        @blur="handleBlur"
      />
      <div v-if="showDropdown && suggestions.length" class="autocomplete-dropdown">
        <button
          v-for="(s, i) in suggestions"
          :key="s.text + s.type"
          class="ac-item"
          :class="{ highlighted: highlightedIndex === i }"
          @mousedown.prevent="selectSuggestion(s.text)"
          @mouseenter="highlightedIndex = i"
        >
          <Icon :name="s.icon" :size="14" class="ac-icon" />
          <span class="ac-text">{{ s.text }}</span>
          <span class="ac-badge">{{ s.type }}</span>
        </button>
      </div>
    </div>
    <div class="result-count">
      {{ results.length.toLocaleString() }} result<span v-if="results.length !== 1">s</span> for
      <strong>“{{ query }}”</strong>
    </div>

    <div class="body">
      <!-- Facets -->
      <button
        class="btn-ghost facets-toggle"
        :class="{ open: showFacets }"
        @click="showFacets = !showFacets"
      >
        <Icon name="filter" :size="14" />
        {{ showFacets ? 'Hide filters' : 'Show filters' }}
      </button>
      <aside class="facets" :class="{ 'facets-hidden': !showFacets }">
        <div class="facet-group">
          <div class="smallcaps facet-title">Subject</div>
          <label v-for="s in drive.subjects.slice(0, 12)" :key="s.id" class="facet-check">
            <input
              type="checkbox"
              :checked="selSubjects.includes(s.id)"
              @change="toggleSubject(s.id)"
            />
            <span class="facet-name">{{ s.name }}</span>
            <span class="facet-count mono">{{ s.count }}</span>
          </label>
        </div>

        <div class="facet-group">
          <div class="smallcaps facet-title">Type</div>
          <label v-for="t in ['Study Guide', 'Lecture Notes', 'Past Exam', 'Problem Set', 'Essay', 'Cheat Sheet']" :key="t" class="facet-check">
            <input type="checkbox" :checked="selTypes.includes(t)" @change="toggleType(t)" />
            <span class="facet-name">{{ t }}</span>
          </label>
        </div>

        <div class="facet-group">
          <div class="smallcaps facet-title">Year</div>
          <div class="year-range">
            <div class="year-track">
              <input
                type="range"
                class="year-input year-min"
                :min="yearBounds.min"
                :max="yearBounds.max"
                :value="yearMin"
                @input="setYearMin(Number(($event.target as HTMLInputElement).value))"
              />
              <input
                type="range"
                class="year-input year-max"
                :min="yearBounds.min"
                :max="yearBounds.max"
                :value="yearMax"
                @input="setYearMax(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
            <div class="year-labels mono">
              <span>{{ yearMin }}</span>
              <span>—</span>
              <span>{{ yearMax }}</span>
            </div>
          </div>
        </div>

        <button class="btn-ghost reset" @click="resetFilters">Reset all filters</button>
      </aside>

      <!-- Results -->
      <main>
        <div class="sort-row">
          <span class="smallcaps sort-label">Sort by</span>
          <button
            v-for="s in SORTS"
            :key="s.id"
            class="sort-tab"
            :class="{ active: sort === s.id }"
            @click="sort = s.id"
          >
            {{ s.label }}
          </button>
        </div>

        <div v-if="pageResults.length">
          <div v-for="p in pageResults" :key="p.id" class="result-row" @click="openPaper(p)">
            <BookCover :paper="p" size="xs" />
            <div class="result-main">
              <div class="result-tags">
                <span class="tag">{{ p.subjectName }}</span>
                <span class="tag tag-paper">{{ p.type }}</span>
              </div>
              <div class="result-title">
                <template v-for="(seg, i) in segments(p.title)" :key="i">
                  <mark v-if="seg.hit">{{ seg.text }}</mark>
                  <template v-else>{{ seg.text }}</template>
                </template>
              </div>
              <div class="result-sub">{{ p.subtitle }}</div>
              <div class="result-meta">
                <Avatar :name="p.contributorName" :size="18" />
                <span>{{ p.contributorName }}</span>
                <span class="dot">·</span>
                <span>{{ p.year }}</span>
                <span class="dot">·</span>
                <span>{{ p.pages }} pages</span>
              </div>
            </div>
            <div class="result-side">
              <span class="mono votes">▲ {{ formatCount(p.upvotes) }}</span>
              <span class="mono-meta">{{ formatCount(p.downloads) }} downloads</span>
            </div>
          </div>
        </div>
        <div v-else class="no-results">
          <div class="no-title">No papers match those filters.</div>
          <div class="no-sub">Try fewer filters or a different search.</div>
        </div>

        <!-- Pagination -->
        <div v-if="pageCount > 1" class="pagination">
          <button
            v-for="n in visiblePages"
            :key="n"
            class="page-btn"
            :class="{ active: page === n }"
            @click="page = n"
          >
            {{ n }}
          </button>
          <span v-if="pageCount > 7 && !visiblePages.includes(pageCount)" class="ellipsis">…</span>
          <button
            v-if="pageCount > 7 && !visiblePages.includes(pageCount)"
            class="page-btn"
            @click="page = pageCount"
          >
            {{ pageCount }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.search {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 48px 32px;
}
.big-search {
  position: relative;
  max-width: 780px;
  display: flex;
  align-items: center;
}
.big-search-icon {
  position: absolute;
  left: 20px;
  color: var(--ink-40);
  pointer-events: none;
}
.big-search-input {
  width: 100%;
  background: var(--ink-0);
  border: 1px solid var(--rule-strong);
  border-radius: 8px;
  padding: 14px 22px 14px 54px;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink-100);
  font-family: var(--font-sans);
}
.big-search-input::placeholder {
  color: var(--ink-30);
}
.big-search-input:focus {
  outline: none;
  border-color: var(--ink-100);
}
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-book);
  overflow: hidden;
  z-index: 100;
  max-height: 320px;
  overflow-y: auto;
}
.ac-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition: background var(--dur-fast);
}
.ac-item:hover,
.ac-item.highlighted {
  background: var(--paper-2);
}
.ac-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.ac-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-badge {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-quiet);
  background: var(--paper-3);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}
.result-count {
  margin-top: 16px;
  margin-bottom: 40px;
  color: var(--ink-70);
  font-size: 14px;
}
.result-count strong {
  color: var(--ink-100);
  font-weight: 600;
}

.body {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 40px;
}

/* Facets */
.facets-toggle {
  display: none;
  align-items: center;
  gap: 6px;
  justify-content: center;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--ink-100);
  margin-bottom: 16px;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.facets-toggle.open {
  background: var(--ink-100);
  color: var(--paper);
  border-color: var(--ink-100);
}
.facets {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.facet-title {
  margin-bottom: 12px;
  font-size: 10px;
}
.facet-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.facet-check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--ink-70);
  border-radius: 3px;
}
.facet-check:hover {
  background: var(--paper-2);
}
.facet-check input[type='checkbox'] {
  width: 14px;
  height: 14px;
  accent-color: var(--ink-100);
  border-radius: 3px;
  margin: 0;
}
.facet-name {
  flex: 1;
}
.facet-count {
  font-size: 10px;
  color: var(--ink-30);
}
.year-range {
  padding: 4px 2px;
}
.year-track {
  position: relative;
  height: 20px;
}
.year-input {
  position: absolute;
  width: 100%;
  height: 20px;
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  pointer-events: none;
}
.year-input::-webkit-slider-runnable-track {
  height: 3px;
  background: var(--rule-strong);
  border-radius: 2px;
}
.year-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ink-100);
  border: 2px solid var(--paper);
  pointer-events: auto;
  cursor: pointer;
  margin-top: -5px;
}
.year-input::-moz-range-track {
  height: 3px;
  background: var(--rule-strong);
  border-radius: 2px;
}
.year-input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ink-100);
  border: 2px solid var(--paper);
  pointer-events: auto;
  cursor: pointer;
}
.year-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ink-40);
  margin-top: 6px;
}
.reset {
  align-self: flex-start;
  font-size: 13px;
}

/* Results */
.sort-row {
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 8px;
}
.sort-label {
  font-size: 10px;
  margin-right: 4px;
}
.sort-tab {
  padding: 12px 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-40);
  background: none;
  border: none;
  border-bottom: 1.5px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--dur-fast);
}
.sort-tab:hover {
  color: var(--ink-100);
}
.sort-tab.active {
  color: var(--ink-100);
  font-weight: 600;
  border-bottom-color: var(--ink-100);
}
.result-row {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 20px;
  padding: 24px 16px;
  border-bottom: 1px solid var(--rule);
  cursor: pointer;
  transition: background var(--dur-fast);
  align-items: start;
}
.result-row:hover {
  background: var(--paper-2);
}
.result-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.result-title {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink-100);
  line-height: 1.2;
  margin-bottom: 4px;
}
.result-sub {
  font-size: 14px;
  color: var(--ink-40);
  margin-bottom: 10px;
}
.result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-70);
}
.result-meta .dot {
  opacity: 0.4;
}
.result-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.votes {
  font-size: 11px;
  color: var(--ink-100);
}
.no-results {
  padding: 80px 16px;
  text-align: center;
}
.no-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--ink-100);
  margin-bottom: 8px;
}
.no-sub {
  font-size: 14px;
  color: var(--ink-40);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 32px;
}
.page-btn {
  width: 36px;
  height: 36px;
  border-radius: 5px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink-70);
  background: transparent;
  border: 1px solid var(--rule);
  cursor: pointer;
  transition: all var(--dur-fast);
}
.page-btn:hover {
  border-color: var(--ink-100);
  color: var(--ink-100);
}
.page-btn.active {
  background: var(--ink-100);
  color: var(--paper);
  border-color: var(--ink-100);
}
.ellipsis {
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: var(--ink-40);
}

@media (max-width: 900px) {
  .body {
    grid-template-columns: 1fr;
  }
  .body > * {
    min-width: 0;
  }
  .facets-toggle {
    display: flex;
  }
  .facets-hidden {
    display: none;
  }
}
@media (max-width: 640px) {
  .search {
    padding: 32px 20px;
  }
  .big-search-input {
    font-size: 19px;
    padding: 13px 16px 13px 46px;
  }
  .big-search-icon {
    left: 16px;
  }
  .result-count {
    margin-bottom: 24px;
    font-size: 13px;
  }
  .sort-row {
    gap: 14px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .sort-row::-webkit-scrollbar {
    display: none;
  }
  .result-row {
    grid-template-columns: 56px 1fr;
    gap: 14px;
    padding: 18px 8px;
  }
  .result-side {
    grid-column: 2;
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
  .result-title {
    font-size: 17px;
  }
  .result-meta {
    flex-wrap: wrap;
    row-gap: 4px;
  }
  .pagination {
    flex-wrap: wrap;
    gap: 4px;
  }
  .page-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  .no-results {
    padding: 48px 8px;
  }
}
</style>
