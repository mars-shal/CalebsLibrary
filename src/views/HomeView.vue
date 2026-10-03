<script setup lang="ts">
// Home — search-first landing. Ported from design_handoff Home.jsx.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { formatCount } from '@/script/design'
import type { Paper } from '@/script/design'
import { trendingSubjects } from '@/script/trends'
import Icon from '@/components/Icon.vue'
import PaperCard from '@/components/PaperCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import Stat from '@/components/Stat.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import { useSearchAutocomplete } from '@/composables/useSearchAutocomplete'

const drive = useDriveStore()
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

const stats = computed(() => [
  { value: drive.stats.papers.toLocaleString(), label: 'Papers' },
  { value: drive.stats.contributors.toLocaleString(), label: 'Contributors' },
  { value: formatCount(drive.stats.reads), label: 'Reads/month' },
  { value: drive.stats.subjects.toLocaleString(), label: 'Subjects' },
])

// Top tags by searches + views + saves — ranked in trends.ts; falls back to
// the store's paper-count order until real usage accumulates.
const quickSubjects = computed(() =>
  trendingSubjects(drive.subjects, drive.papers, drive.searchTrends).slice(0, 8),
)

function openPaper(p: Paper) {
  router.push({ name: 'paper', params: { id: p.id } })
}

function handleBlur(): void {
  window.setTimeout(() => {
    showDropdown.value = false
    highlightedIndex.value = -1
  }, 120)
}
const DAY_PHRASES = [
  'What do you wanna learn today?',
  'Good morning — what are we studying?',
  'Locked in. I see you.',
  'Semester survival starts here.',
  "Coffee in hand? Let's find your book.",
  'Lecture notes not cutting it? Let\'s dig deeper.',
  "Deadline szn or just curious today?",
  "What's today's rabbit hole?",
  'Back at it. What are we reading?',
  "Library's open, brain's (hopefully) online.",
];

const NIGHT_PHRASES = [
  'Hey night owl…',
  'Burning the midnight oil?',
  "It's late — the library is still open.",
  'Night shift. I see you.',
  'Essay due tomorrow? I got you.',
  '3am thoughts, 3am research.',
  'The library never sleeps. Neither do you, apparently.',
  "Cramming or just can't sleep?",
  "Quiet hours, loud thoughts. What's up?",
  "Everyone else is asleep. We're not.",
  'Last-minute reading list? Let\'s go.',
  'Dark mode on. Brain still on too.',
];

const cycledText = ref('')

type Season = 'exam' | 'test' | 'term' | ''

// Seasonal punch-ins layered on the day/night pools. Windows are approximate
// academic-calendar ranges: finals late Nov–Dec & mid Mar–Apr, mid-terms
// Oct–mid Nov & mid Feb–mid Mar, term start in Jan & Aug–Sep.
const SEASON_PHRASES: Record<Exclude<Season, ''>, string[]> = {
  exam: [
    'Exam season — one past paper at a time.',
    "Finals week. The library's your study room.",
    'Past papers, mock exams, last-minute notes.',
    "Final stretch. One more paper and you're done.",
    "Exams don't wait. Neither does the library.",
  ],
  test: [
    'Mid-terms are coming. Stock up now.',
    'Test week survival starts here.',
    'Practice sets for the tests ahead.',
    "Cram session? The library's got you.",
  ],
  term: [
    'New term, new syllabus. Grab your reading list.',
    'Welcome back — your courses are waiting.',
    'New semester, fresh notes ahead.',
    "First week back. Let's get organized.",
  ],
}

// Day-of-week punch-ins on top of the day/night + seasonal pools, keyed by
// Date.getDay() (0=Sunday..6=Saturday). Keeps the masthead line feeling
// attuned to the actual rhythm of the week.
const WEEKDAY_PHRASES: Record<number, string[]> = {
  0: ['Sunday reset — light read or deep dive?', 'Weekend stay-in-study mode.'],
  1: ['Monday fresh start. Pick a course.', 'New week, new rabbit hole.'],
  2: ['Tuesday traction. Keep the streak.', 'Mid-quad day. What needs a second look?'],
  3: ['Hump day — push through one more.', 'Wednesday. Halfway to the weekend.'],
  4: ['Thursday grind. Almost there.', 'Weekend preview. One more topic?'],
  5: ['Friday wind-down. Review or relax?', "Last push before the weekend."],
  6: ['Saturday study sesh.', 'Weekend deep-dive. No rush.'],
}

function seasonFor(date: Date): Season {
  const m = date.getMonth() + 1
  const d = date.getDate()
  const inWindow = (fromM: number, fromD: number, toM: number, toD: number): boolean => {
    const from = fromM * 100 + fromD
    const to = toM * 100 + toD
    const today = m * 100 + d
    return today >= from && today <= to
  }
  if (inWindow(11, 15, 12, 31) || inWindow(3, 10, 4, 30)) return 'exam'
  if (inWindow(10, 1, 11, 14) || inWindow(2, 15, 3, 9)) return 'test'
  if (inWindow(1, 5, 2, 14) || inWindow(8, 15, 9, 30)) return 'term'
  return ''
}

function phraseFor(date: Date): string {
  const h = date.getHours()
  const isNight = h >= 18 || h < 6
  const base = isNight ? NIGHT_PHRASES : DAY_PHRASES
  const season = seasonFor(date)
  const seasonal = season ? SEASON_PHRASES[season] : undefined
  const weekday = WEEKDAY_PHRASES[date.getDay()]
  const pool = [...base, ...(seasonal ?? []), ...(weekday ?? [])]
  const dayNum = Math.floor(date.getTime() / 86400000)
  return pool[dayNum % pool.length]!
}

function nextBoundary(now: Date): Date {
  const at6 = new Date(now)
  at6.setHours(6, 0, 0, 0)
  if (at6 <= now) at6.setDate(at6.getDate() + 1)
  const at18 = new Date(now)
  at18.setHours(18, 0, 0, 0)
  if (at18 <= now) at18.setDate(at18.getDate() + 1)
  return at6 < at18 ? at6 : at18
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null
function scheduleRefresh(): void {
  if (refreshTimer) clearTimeout(refreshTimer)
  const wait = nextBoundary(new Date()).getTime() - Date.now()
  refreshTimer = setTimeout(() => {
    cycledText.value = phraseFor(new Date())
    scheduleRefresh()
  }, wait)
}
onMounted(() => {
  cycledText.value = phraseFor(new Date())
  scheduleRefresh()
})
onBeforeUnmount(() => {
  if (refreshTimer) clearTimeout(refreshTimer)
})
const isLoading = computed(() => drive.loading && drive.papers.length === 0)
</script>

<template>
  <div class="screen-wrap">
    <!-- Masthead -->
    <section class="masthead">

      <h1 class="masthead-title">
        <Transition name="cycle" mode="out-in">
          <span :key="cycledText" class="serif-italic">{{ cycledText }}</span>
        </Transition>
      </h1>

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
        <span class="enter-chip">Enter ↵</span>
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

      <div class="quick-row">
        <span class="quick-label">Or browse:</span>
        <template v-if="isLoading">
          <span v-for="i in 6" :key="i" class="sk pill-sk" />
        </template>
        <template v-else>
          <button
            v-for="s in quickSubjects"
            :key="s.id"
            class="pill"
            @click="router.push({ name: 'subject', params: { id: s.id } })"
          >
            {{ s.name }}
          </button>
          <button class="pill pill-dashed" @click="router.push({ name: 'browse' })">
            All {{ drive.subjects.length }} subjects →
          </button>
        </template>
      </div>

      <div class="stats-strip">
        <template v-if="isLoading">
          <div v-for="i in 4" :key="i" class="sk stat-sk">
            <div class="sk stat-sk-value" />
            <div class="sk stat-sk-label" />
          </div>
        </template>
        <template v-else>
          <Stat v-for="s in stats" :key="s.label" :value="s.value" :label="s.label" />
        </template>
      </div>
    </section>

    <!-- Recently added -->
    <section class="wrap" style="padding-top: 80px">
      <SectionHeader eyebrow="This week" title="Recently added">
        <template #action>
          <button class="btn-ghost" @click="router.push({ name: 'browse' })">View all →</button>
        </template>
      </SectionHeader>
      <SkeletonCard v-if="isLoading" :count="5" size="sm" />
      <div v-else-if="drive.recentPapers.length" class="grid-5">
        <PaperCard
          v-for="p in drive.recentPapers"
          :key="p.id"
          :paper="p"
          size="sm"
          @click="openPaper(p)"
        />
      </div>
      <div v-else class="loading-box">{{ drive.error || 'No papers yet.' }}</div>
    </section>
  </div>
</template>

<style scoped>
.masthead {
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 32px 0;
  text-align: center;
}
.masthead-title {
  font-family: var(--font-serif);
  font-size: clamp(40px, 8vw, 80px);
  line-height: 0.9;
  letter-spacing: -0.04em;
  font-weight: 500;
  color: var(--ink-100);
  margin: 0;
}

.serif-plain {
  font-style: normal;
}
.serif-italic {
  font-style: normal;
}
.tagline {
  font-size: 18px;
  line-height: 1.55;
  color: var(--ink-70);
  max-width: 620px;
  margin: 24px auto 0;
  text-wrap: balance;
}
.big-search {
  position: relative;
  max-width: 640px;
  margin: 40px auto 0;
  display: flex;
  align-items: center;
}
.big-search-icon {
  position: absolute;
  left: 22px;
  color: var(--ink-40);
  pointer-events: none;
}
.big-search-input {
  width: 100%;
  background: var(--ink-0);
  border: 1px solid var(--rule-strong);
  border-radius: 8px;
  padding: 18px 22px 18px 56px;
  font-size: 16px;
  letter-spacing: -0.005em;
  color: var(--ink-100);
  font-family: var(--font-sans);
  transition: border-color var(--dur-fast), box-shadow var(--dur-fast);
}
.big-search-input::placeholder {
  color: var(--ink-30);
}
.big-search-input:focus {
  outline: none;
  border-color: var(--ink-100);
  box-shadow: var(--shadow-focus);
}
.enter-chip {
  position: absolute;
  right: 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-40);
  background: var(--paper-2);
  border: 1px solid var(--rule);
  padding: 3px 8px;
  border-radius: 4px;
  pointer-events: none;
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
.cycle-enter-active,
.cycle-leave-active {
  transition: opacity var(--dur-med) var(--ease-out), transform var(--dur-med) var(--ease-out);
}
.cycle-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.cycle-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.quick-row {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.quick-label {
  color: var(--ink-40);
  font-size: 13px;
}
.pill {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--rule-strong);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-100);
  background: transparent;
  transition: all var(--dur-fast) var(--ease-out);
  cursor: pointer;
}
.pill:hover {
  background: var(--ink-100);
  color: var(--paper);
}
.pill-dashed {
  border-style: dashed;
}
.stats-strip {
  margin-top: 64px;
  padding-top: 48px;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: center;
  gap: 64px;
  flex-wrap: wrap;
}

/* Masthead loading placeholders: pills + stats shimmer while the library loads */
.sk {
  position: relative;
  overflow: hidden;
  background: var(--paper-3);
  border-radius: 4px;
}
.sk::after {
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
.pill-sk {
  width: 88px;
  height: 30px;
  border-radius: 999px;
}
.stat-sk {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: none;
}
.stat-sk::after {
  display: none;
}
.stat-sk-value {
  width: 64px;
  height: 24px;
}
.stat-sk-label {
  width: 48px;
  height: 10px;
}
@keyframes sk-shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
.wrap {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 32px;
}
.wrap-narrow {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px;
}
.grid-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 24px;
}
.loading-box {
  padding: 48px;
  text-align: center;
  color: var(--ink-40);
  border: 1px dashed var(--rule-strong);
  border-radius: 8px;
}

@media (max-width: 960px) {
  .grid-5 {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 640px) {
  .grid-5 {
    grid-template-columns: repeat(2, 1fr);
  }
  .wrap,
  .wrap-narrow {
    padding: 0 20px;
  }
  .masthead {
    padding: 56px 20px 0;
  }
  .big-search {
    margin-top: 28px;
  }
  .quick-row {
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 24px;
  }
  .stats-strip {
    flex-wrap: wrap;
    gap: 20px;
  }
}
</style>
