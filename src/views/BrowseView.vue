<script setup lang="ts">
// Browse — College→Program→Level hierarchy. NOT subject-first shelves.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import Icon from '@/components/Icon.vue'
import IndexStack from '@/components/IndexStack.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'

const drive = useDriveStore()
const router = useRouter()
const route = useRoute()

// College → Program → Level drill-down state
const selectedCollege = ref<string | null>(null)
const selectedProgram = ref<string | null>(null)
const selectedLevel = ref<string | null>(null)

// Build hierarchy from papers
const colleges = computed(() => {
  const map = new Map<string, { name: string; programs: Map<string, { name: string; levels: Set<string> }> }>()
  for (const p of drive.papers) {
    const college = (p as any).college || 'General'
    const program = (p as any).program || 'General'
    const level = (p as any).level || '100'
    if (!map.has(college)) map.set(college, { name: college, programs: new Map() })
    const c = map.get(college)!
    if (!c.programs.has(program)) c.programs.set(program, { name: program, levels: new Set() })
    c.programs.get(program)!.levels.add(level)
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const programs = computed(() => {
  if (!selectedCollege.value) return []
  const college = colleges.value.find(c => c.name === selectedCollege.value)
  if (!college) return []
  return [...college.programs.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const levels = computed(() => {
  if (!selectedCollege.value || !selectedProgram.value) return []
  const college = colleges.value.find(c => c.name === selectedCollege.value)
  if (!college) return []
  const program = college.programs.get(selectedProgram.value)
  if (!program) return []
  return [...program.levels].sort()
})

// Filtered papers based on drill-down
const filteredPapers = computed(() => {
  let list = drive.papers
  if (selectedCollege.value) {
    list = list.filter(p => (p as any).college === selectedCollege.value)
  }
  if (selectedProgram.value) {
    list = list.filter(p => (p as any).program === selectedProgram.value)
  }
  if (selectedLevel.value) {
    list = list.filter(p => (p as any).level === selectedLevel.value)
  }
  return list
})

const isLoading = computed(() => drive.loading && drive.papers.length === 0)

function selectCollege(name: string) {
  selectedCollege.value = name
  selectedProgram.value = null
  selectedLevel.value = null
}

function selectProgram(name: string) {
  selectedProgram.value = name
  selectedLevel.value = null
}

function selectLevel(level: string) {
  selectedLevel.value = level
}

function goBack() {
  if (selectedLevel.value) {
    selectedLevel.value = null
  } else if (selectedProgram.value) {
    selectedProgram.value = null
  } else if (selectedCollege.value) {
    selectedCollege.value = null
  }
}

function openPaper(p: any) {
  router.push({ name: 'paper', params: { id: p.id } })
}

// Breadcrumb
const breadcrumb = computed(() => {
  const crumbs: { label: string; action?: () => void }[] = []
  if (selectedCollege.value) {
    crumbs.push({ label: selectedCollege.value, action: () => { selectedCollege.value = null; selectedProgram.value = null; selectedLevel.value = null } })
  }
  if (selectedProgram.value) {
    crumbs.push({ label: selectedProgram.value, action: () => { selectedProgram.value = null; selectedLevel.value = null } })
  }
  if (selectedLevel.value) {
    crumbs.push({ label: `Level ${selectedLevel.value}` })
  }
  return crumbs
})
</script>

<template>
  <div class="browse">
    <!-- Header with back -->
    <div class="browse-header">
      <button v-if="selectedCollege" class="back-btn" @click="goBack">
        <Icon name="arrow-left" :size="18" />
        <span>Back</span>
      </button>
      <h1 class="browse-title">Browse</h1>
    </div>

    <!-- Breadcrumb -->
    <div v-if="breadcrumb.length" class="breadcrumb">
      <button class="crumb" @click="selectedCollege = null; selectedProgram = null; selectedLevel = null">All</button>
      <template v-for="(c, i) in breadcrumb" :key="i">
        <Icon name="chevron" :size="12" class="crumb-sep" />
        <button v-if="c.action" class="crumb crumb-link" @click="c.action">{{ c.label }}</button>
        <span v-else class="crumb">{{ c.label }}</span>
      </template>
    </div>

    <SkeletonCard v-if="isLoading" :count="6" size="sm" />

    <!-- Level picker -->
    <template v-else-if="selectedCollege && selectedProgram && !selectedLevel">
      <div class="level-grid">
        <button
          v-for="level in levels"
          :key="level"
          class="level-card"
          @click="selectLevel(level)"
        >
          <div class="level-num">{{ level }}</div>
          <div class="level-label">Level {{ level }}</div>
        </button>
      </div>
    </template>

    <!-- Program picker -->
    <template v-else-if="selectedCollege && !selectedProgram">
      <div class="program-grid">
        <button
          v-for="prog in programs"
          :key="prog.name"
          class="program-card"
          @click="selectProgram(prog.name)"
        >
          <div class="program-name">{{ prog.name }}</div>
          <div class="program-levels">{{ prog.levels.size }} levels</div>
        </button>
      </div>
    </template>

    <!-- College picker -->
    <template v-else-if="!selectedCollege">
      <div class="college-grid">
        <button
          v-for="college in colleges"
          :key="college.name"
          class="college-card"
          @click="selectCollege(college.name)"
        >
          <div class="college-name">{{ college.name }}</div>
          <div class="college-programs">{{ college.programs.size }} programs</div>
        </button>
      </div>
    </template>

    <!-- Papers list (when at leaf level) -->
    <template v-else>
      <div class="papers-header">
        <span class="papers-count">{{ filteredPapers.length }} papers</span>
      </div>
      <div class="papers-grid">
        <div
          v-for="p in filteredPapers"
          :key="p.id"
          class="paper-row"
          @click="openPaper(p)"
        >
          <IndexStack :paper="p" size="xs" />
          <div class="paper-info">
            <div class="paper-title">{{ p.title }}</div>
            <div class="paper-meta">
              <span>{{ p.type }}</span>
              <span class="dot">·</span>
              <span>{{ p.year }}</span>
              <span class="dot">·</span>
              <span>{{ (p as any).course || '' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!filteredPapers.length" class="empty-box">No papers at this level yet.</div>
    </template>
  </div>
</template>

<style scoped>
.browse {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px;
  animation: fade-in var(--dur-med) var(--ease-out);
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.browse-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  padding: 8px 12px;
  border-radius: var(--r-sm);
  transition: all var(--dur-fast);
}
.back-btn:hover {
  color: var(--text-primary);
  background: var(--bg-default);
}
.browse-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin: 0;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 32px;
  font-size: 13px;
}
.crumb {
  color: var(--text-tertiary);
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: var(--r-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.crumb-link {
  color: var(--text-secondary);
}
.crumb-link:hover {
  color: var(--text-primary);
  background: var(--bg-default);
}
.crumb-sep {
  color: var(--text-quiet);
}

/* College grid */
.college-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.college-card {
  padding: 24px;
  background: var(--bg-default);
  border: 1px solid var(--border-default);
  border-radius: var(--r-lg);
  text-align: left;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.college-card:hover {
  background: var(--bg-elevated);
  transform: translateY(-2px);
}
.college-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.college-programs {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Program grid */
.program-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.program-card {
  padding: 20px;
  background: var(--bg-default);
  border: 1px solid var(--border-default);
  border-radius: var(--r-lg);
  text-align: left;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.program-card:hover {
  background: var(--bg-elevated);
  transform: translateY(-2px);
}
.program-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.program-levels {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Level grid */
.level-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.level-card {
  padding: 20px;
  background: var(--bg-default);
  border: 1px solid var(--border-default);
  border-radius: var(--r-lg);
  text-align: center;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.level-card:hover {
  background: var(--text-primary);
  color: var(--bg-default);
  border-color: var(--text-primary);
}
.level-num {
  font-size: 24px;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
}
.level-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}
.level-card:hover .level-label {
  color: var(--bg-default);
  opacity: 0.7;
}

/* Papers */
.papers-header {
  margin-bottom: 16px;
}
.papers-count {
  font-size: 13px;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}
.papers-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.paper-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--dur-fast);
}
.paper-row:hover {
  background: var(--bg-default);
}
.paper-info {
  flex: 1;
  min-width: 0;
}
.paper-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.paper-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-top: 4px;
}
.dot {
  opacity: 0.3;
}

/* Empty */
.empty-box {
  padding: 48px;
  text-align: center;
  color: var(--text-tertiary);
  border: 1px dashed var(--border-default);
  border-radius: 10px;
}

@media (max-width: 720px) {
  .browse { padding: 20px; }
  .college-grid, .program-grid { grid-template-columns: repeat(2, 1fr); }
  .level-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
