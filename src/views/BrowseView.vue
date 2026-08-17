<script setup lang="ts">
// Browse — cover-forward shelves. Ported from design_handoff Browse.jsx.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { PAPER_TYPES } from '@/script/design'
import type { Paper, Subject } from '@/script/design'
import Icon from '@/components/Icon.vue'
import PaperCard from '@/components/PaperCard.vue'

const drive = useDriveStore()
const router = useRouter()

const subjectFilter = ref('all')
const typeFilter = ref('all')
const view = ref<'shelf' | 'grid'>('shelf')

const TYPES = PAPER_TYPES

const visibleSubjects = computed<Subject[]>(() =>
  drive.subjects.filter(
    (s) => subjectFilter.value === 'all' || s.id === subjectFilter.value,
  ),
)

const visibleTypes = computed<string[]>(() =>
  typeFilter.value === 'all' ? TYPES : [typeFilter.value],
)

const bySubject = computed(() => {
  const map: Record<string, Paper[]> = {}
  for (const s of visibleSubjects.value) {
    map[s.id] = drive.papersBySubject(s.id).filter((p) =>
      visibleTypes.value.includes(p.type),
    )
  }
  return map
})

const totalCount = computed(() => Object.values(bySubject.value).reduce((n, arr) => n + arr.length, 0))

const anyResults = computed(() => totalCount.value > 0)

function openPaper(p: Paper) {
  router.push({ name: 'paper', params: { id: p.id } })
}
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
            All subjects
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
      </div>
      <div class="filter-right">
        <span class="mono count">{{ totalCount.toLocaleString() }} papers</span>
        <div class="view-toggle">
          <button :class="{ active: view === 'shelf' }" @click="view = 'shelf'">
            <Icon name="list" :size="14" /> Shelves
          </button>
          <button :class="{ active: view === 'grid' }" @click="view = 'grid'">
            <Icon name="grid" :size="14" /> Grid
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!anyResults" class="empty-state">
      <div class="empty-title">These shelves are empty</div>
      <div class="empty-sub">Try loosening your filters.</div>
    </div>

    <!-- Grid view -->
    <div v-else-if="view === 'grid'" class="grid-view">
      <PaperCard
        v-for="p in drive.papers.filter(
          (p) =>
            (subjectFilter === 'all' || p.subject === subjectFilter) &&
            (typeFilter === 'all' || p.type === typeFilter),
        )"
        :key="p.id"
        :paper="p"
        size="sm"
        @click="openPaper(p)"
      />
    </div>

    <!-- Shelf view -->
    <div v-else class="shelf-view">
      <section v-for="s in visibleSubjects" :key="s.id" class="shelf-section">
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
          <div v-for="p in bySubject[s.id]" :key="p.id" class="shelf-book">
            <PaperCard :paper="p" size="sm" @click="openPaper(p)" />
          </div>
        </div>
        <div v-if="bySubject[s.id]?.length" class="shelf-ink" />
        <div v-if="bySubject[s.id]?.length" class="shelf-shadow" />
      </section>
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
.view-toggle {
  display: flex;
  border: 1px solid var(--rule);
  border-radius: 6px;
  overflow: hidden;
}
.view-toggle button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-70);
  background: transparent;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.view-toggle button.active {
  background: var(--ink-0);
  color: var(--ink-100);
  box-shadow: var(--shadow-soft);
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

/* Grid view */
.grid-view {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 32px;
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
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
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

@media (max-width: 960px) {
  .grid-view {
    grid-template-columns: repeat(3, 1fr);
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
    margin-bottom: 32px;
  }
  .filter-right {
    width: 100%;
    justify-content: space-between;
  }
  .divider {
    display: none;
  }
  .grid-view {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .empty-state {
    padding: 48px 20px;
  }
  .shelf-view {
    gap: 48px;
  }
  .shelf-book {
    width: 108px;
  }
  .shelf-head {
    gap: 12px;
  }
  .shelf-open {
    font-size: 12.5px;
  }
}
</style>
