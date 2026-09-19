<script setup lang="ts">
// Home — feed-first landing. NOT masthead→pills→stats.
// Two-column: hero left + search, right column: quick actions + recent.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { formatCount } from '@/script/design'
import type { Paper } from '@/script/design'
import { trendingSubjects } from '@/script/trends'
import Icon from '@/components/Icon.vue'
import IndexStack from '@/components/IndexStack.vue'
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

const quickSubjects = computed(() =>
  trendingSubjects(drive.subjects, drive.papers, drive.searchTrends).slice(0, 6),
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
  <div class="home">
    <!-- Hero: full-width statement -->
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">
          <Transition name="cycle" mode="out-in">
            <span :key="cycledText">{{ cycledText }}</span>
          </Transition>
        </h1>

        <div ref="containerRef" class="search-container">
          <Icon name="search" :size="18" class="search-icon" />
          <input
            v-model="query"
            class="search-input"
            type="text"
            autocomplete="off"
            placeholder="Search by course, topic, or title..."
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
      </div>
    </section>

    <!-- Quick actions: 2x2 grid -->
    <section class="section">
      <div class="section-inner">
        <div class="quick-grid">
          <button class="quick-card" @click="router.push('/browse')">
            <Icon name="books" :size="22" />
            <div class="quick-card-text">
              <div class="quick-card-title">Browse</div>
              <div class="quick-card-sub">All courses & papers</div>
            </div>
          </button>
          <button class="quick-card" @click="router.push({ name: 'search' })">
            <Icon name="search" :size="22" />
            <div class="quick-card-text">
              <div class="quick-card-title">Search</div>
              <div class="quick-card-sub">Find specific notes</div>
            </div>
          </button>
          <button class="quick-card" @click="router.push({ name: 'upload' })">
            <Icon name="upload" :size="22" />
            <div class="quick-card-text">
              <div class="quick-card-title">Contribute</div>
              <div class="quick-card-sub">Share your notes</div>
            </div>
          </button>
          <button class="quick-card" @click="router.push({ name: 'browse' })">
            <Icon name="bookmark" :size="22" />
            <div class="quick-card-text">
              <div class="quick-card-title">Saved</div>
              <div class="quick-card-sub">Your bookmarks</div>
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- Stats row -->
    <section class="section">
      <div class="section-inner">
        <div class="stats-row">
          <template v-if="isLoading">
            <div v-for="i in 4" :key="i" class="stat-item">
              <div class="sk stat-val" />
              <div class="sk stat-lbl" />
            </div>
          </template>
          <template v-else>
            <div v-for="s in stats" :key="s.label" class="stat-item">
              <div class="stat-val">{{ s.value }}</div>
              <div class="stat-lbl">{{ s.label }}</div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Trending subjects -->
    <section class="section" v-if="!isLoading && quickSubjects.length">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">Trending</h2>
          <button class="section-link" @click="router.push('/browse')">View all →</button>
        </div>
        <div class="trending-grid">
          <button
            v-for="s in quickSubjects"
            :key="s.id"
            class="trending-chip"
            @click="router.push({ name: 'subject', params: { id: s.id } })"
          >
            <span class="trending-name">{{ s.name }}</span>
            <span class="trending-count">{{ s.count }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Recently added -->
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">Recently added</h2>
          <button class="section-link" @click="router.push('/browse')">View all →</button>
        </div>
        <SkeletonCard v-if="isLoading" :count="3" size="sm" />
        <div v-else-if="drive.recentPapers.length" class="recent-scroll">
          <div
            v-for="p in drive.recentPapers.slice(0, 8)"
            :key="p.id"
            class="recent-card"
            @click="openPaper(p)"
          >
            <IndexStack :paper="p" size="sm" />
            <div class="recent-meta">
              <div class="recent-title">{{ p.title }}</div>
              <div class="recent-info">{{ p.type }} · {{ p.year }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-box">{{ drive.error || 'No papers yet.' }}</div>
      </div>
    </section>

    <!-- Most loved -->
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">Most loved</h2>
          <button class="section-link" @click="router.push('/browse')">View all →</button>
        </div>
        <SkeletonCard v-if="isLoading" :count="3" size="sm" />
        <div v-else-if="drive.lovedPapers.length" class="recent-scroll">
          <div
            v-for="p in drive.lovedPapers.slice(0, 8)"
            :key="p.id"
            class="recent-card"
            @click="openPaper(p)"
          >
            <IndexStack :paper="p" size="sm" />
            <div class="recent-meta">
              <div class="recent-title">{{ p.title }}</div>
              <div class="recent-info">{{ p.type }} · {{ p.year }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-box">{{ drive.error || 'No papers yet.' }}</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  animation: fade-in var(--dur-med) var(--ease-out);
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Hero — full-width statement, no background box */
.hero {
  padding: 80px 32px 48px;
  max-width: 720px;
  margin: 0 auto;
}
.hero-title {
  font-family: var(--font-heading);
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.15;
  letter-spacing: -0.03em;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  min-height: 1.2em;
}

/* Search — pill shape, no box */
.search-container {
  position: relative;
  margin-top: 28px;
}
.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}
.search-input {
  width: 100%;
  background: var(--bg-default);
  border: none;
  border-radius: 999px;
  padding: 16px 20px 16px 48px;
  font-size: 15px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  transition: background var(--dur-fast);
}
.search-input::placeholder {
  color: var(--text-tertiary);
}
.search-input:focus {
  outline: none;
  background: var(--bg-elevated);
}
.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--r-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
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
  padding: 12px 16px;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition: background var(--dur-fast);
}
.ac-item:hover,
.ac-item.highlighted {
  background: var(--bg-default);
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
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* Section layout */
.section {
  padding: 0 32px;
}
.section + .section {
  margin-top: 56px;
}
.section-inner {
  max-width: 960px;
  margin: 0 auto;
}
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0;
}
.section-link {
  font-size: 13px;
  color: var(--text-tertiary);
  transition: color var(--dur-fast);
}
.section-link:hover {
  color: var(--text-primary);
}

/* Quick actions grid */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: var(--bg-default);
  border: 1px solid var(--border-default);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  text-align: left;
}
.quick-card:hover {
  background: var(--bg-elevated);
  transform: translateY(-2px);
}
.quick-card svg {
  color: var(--text-secondary);
  flex-shrink: 0;
}
.quick-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.quick-card-sub {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

/* Stats row */
.stats-row {
  display: flex;
  gap: 48px;
  padding: 24px 0;
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-default);
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-val {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  font-family: var(--font-mono);
}
.stat-lbl {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Trending chips */
.trending-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.trending-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--border-default);
  border-radius: 999px;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.trending-chip:hover {
  background: var(--text-primary);
  color: var(--bg-default);
  border-color: var(--text-primary);
}
.trending-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-tertiary);
}
.trending-chip:hover .trending-count {
  color: var(--bg-default);
  opacity: 0.6;
}

/* Recent papers — horizontal scroll row */
.recent-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}
.recent-scroll::-webkit-scrollbar {
  height: 4px;
}
.recent-scroll::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 2px;
}
.recent-card {
  flex-shrink: 0;
  width: 140px;
  scroll-snap-align: start;
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-out);
}
.recent-card:hover {
  transform: translateY(-4px);
}
.recent-meta {
  margin-top: 10px;
}
.recent-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.recent-info {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 4px;
  font-family: var(--font-mono);
}

/* Skeleton */
.sk {
  position: relative;
  overflow: hidden;
  background: var(--bg-default);
  border-radius: 4px;
}
.sk::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--bg-skeleton);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.stat-val { width: 48px; height: 22px; }
.stat-lbl { width: 64px; height: 10px; }

/* Empty */
.empty-box {
  padding: 48px;
  text-align: center;
  color: var(--text-tertiary);
  border: 1px dashed var(--border-default);
  border-radius: 10px;
}

/* Cycle transitions */
.cycle-enter-active,
.cycle-leave-active {
  transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out);
}
.cycle-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.cycle-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 720px) {
  .hero { padding: 56px 20px 32px; }
  .section { padding: 0 20px; }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-row { gap: 24px; flex-wrap: wrap; }
  .recent-card { width: 120px; }
}
</style>
