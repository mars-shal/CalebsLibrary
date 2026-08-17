<script setup lang="ts">
// Home — search-first landing. Ported from design_handoff Home.jsx.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { formatCount } from '@/script/design'
import type { Paper } from '@/script/design'
import Icon from '@/components/Icon.vue'
import PaperCard from '@/components/PaperCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import Stat from '@/components/Stat.vue'
import Avatar from '@/components/Avatar.vue'
import BookCover from '@/components/BookCover.vue'

const drive = useDriveStore()
const router = useRouter()
const query = ref('')

const stats = computed(() => [
  { value: drive.stats.papers.toLocaleString(), label: 'Papers' },
  { value: drive.stats.contributors.toLocaleString(), label: 'Contributors' },
  { value: formatCount(drive.stats.reads), label: 'Reads/month' },
  { value: drive.stats.subjects.toLocaleString(), label: 'Subjects' },
])

const caleb = computed(() => drive.founder)

function goSearch() {
  const q = query.value.trim()
  if (q) router.push({ name: 'search', query: { q } })
}

function openPaper(p: Paper) {
  router.push({ name: 'paper', params: { id: p.id } })
}
</script>

<template>
  <div class="screen-wrap">
    <!-- Masthead -->
    <section class="masthead">
      <div class="smallcaps" style="margin-bottom: 24px">Est. 2019 · A community library</div>
      <h1 class="masthead-title">
        <span class="serif-italic">Caleb's</span> <span class="serif-plain">Library.</span>
      </h1>
      <p class="tagline">
        A student-run library of notes, papers, and study guides. Open to anyone. Kept by whoever shows up.
      </p>

      <div class="big-search">
        <Icon name="search" :size="20" class="big-search-icon" />
        <input
          v-model="query"
          class="big-search-input"
          type="text"
          placeholder="Search the library…"
          @keyup.enter="goSearch"
        />
        <span class="enter-chip">Enter ↵</span>
      </div>

      <div class="quick-row">
        <span class="quick-label">Or browse:</span>
        <button
          v-for="s in drive.subjects.slice(0, 8)"
          :key="s.id"
          class="pill"
          @click="router.push({ name: 'subject', params: { id: s.id } })"
        >
          {{ s.name }}
        </button>
        <button class="pill pill-dashed" @click="router.push({ name: 'browse' })">
          All {{ drive.subjects.length }} subjects →
        </button>
      </div>

      <div class="stats-strip">
        <Stat v-for="s in stats" :key="s.label" :value="s.value" :label="s.label" />
      </div>
    </section>

    <!-- Recently added -->
    <section class="wrap" style="padding-top: 80px">
      <SectionHeader eyebrow="This week" title="Recently added">
        <template #action>
          <button class="btn-ghost" @click="router.push({ name: 'browse' })">View all →</button>
        </template>
      </SectionHeader>
      <div v-if="drive.recentPapers.length" class="grid-6">
        <PaperCard
          v-for="p in drive.recentPapers"
          :key="p.id"
          :paper="p"
          size="sm"
          @click="openPaper(p)"
        />
      </div>
      <div v-else class="loading-box">{{ drive.error || 'Loading the library…' }}</div>
    </section>

    <!-- Most loved -->
    <section class="wrap" style="padding-top: 80px">
      <SectionHeader eyebrow="All-time" title="Most loved by readers" />
      <div class="loved-box">
        <div v-for="(p, i) in drive.lovedPapers" :key="p.id" class="loved-row" @click="openPaper(p)">
          <div class="loved-rank">{{ String(i + 1).padStart(2, '0') }}</div>
          <BookCover :paper="p" size="xs" />
          <div class="loved-main">
            <div class="loved-title">{{ p.title }}</div>
            <div class="mono-meta">{{ p.subjectName }} · {{ p.type }} · {{ p.contributorName }}</div>
          </div>
          <div class="loved-side">
            <span class="mono up">▲ {{ formatCount(p.upvotes) }}</span>
            <span class="loved-reads">{{ formatCount(p.views) }} reads</span>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-card wrap-narrow">
      <div>
        <div class="smallcaps" style="margin-bottom: 8px">Have notes to share?</div>
        <div class="cta-title">Pass along the notes that carried you through.</div>
        <div class="cta-sub">
          Upload a PDF, add a title, and it goes on the shelves once a moderator confirms it. No account. No signup. Two minutes.
        </div>
      </div>
      <button class="btn btn-primary cta-btn" @click="router.push({ name: 'upload' })">
        Contribute a paper →
      </button>
    </section>

    <!-- Founder note -->
    <section class="founder wrap-narrow">
      <Avatar :user="caleb" :size="56" />
      <div>
        <blockquote class="founder-quote">
          “I started this as a shared drive with three friends in 2019. It grew because people kept
          adding things. That's the whole model — add what you can, take what you need.”
        </blockquote>
        <div class="founder-attrib"><strong>{{ caleb?.name }}</strong> — founder, still uploading</div>
      </div>
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
  font-size: clamp(56px, 11vw, 120px);
  line-height: 0.9;
  letter-spacing: -0.04em;
  font-weight: 500;
  color: var(--ink-100);
  margin: 0;
}
.serif-italic {
  font-style: italic;
}
.serif-plain {
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
.grid-6 {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;
}
.loading-box {
  padding: 48px;
  text-align: center;
  color: var(--ink-40);
  border: 1px dashed var(--rule-strong);
  border-radius: 8px;
}
.loved-box {
  border: 1px solid var(--rule);
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
}
.loved-row {
  display: grid;
  grid-template-columns: 48px 64px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--rule);
  cursor: pointer;
  transition: background var(--dur-fast);
}
.loved-row:nth-last-child(-n + 2) {
  border-bottom: none;
}
.loved-row:hover {
  background: var(--paper-2);
}
.loved-rank {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 34px;
  color: var(--ink-30);
  text-align: center;
}
.loved-main {
  min-width: 0;
}
.loved-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--ink-100);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.loved-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.loved-reads {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-30);
}
.up {
  color: var(--ink-100);
}
.cta-card {
  margin-top: 96px;
  padding: 48px 40px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--bg-elevated);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: center;
}
.cta-title {
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink-100);
  line-height: 1.15;
  max-width: 560px;
}
.cta-sub {
  font-size: 14px;
  color: var(--ink-70);
  margin-top: 12px;
  max-width: 560px;
  line-height: 1.6;
}
.founder {
  margin-top: 80px;
  margin-bottom: 32px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.founder-quote {
  margin: 0 0 12px;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 22px;
  line-height: 1.5;
  color: var(--ink-100);
}
.founder-attrib {
  font-size: 13px;
  color: var(--ink-70);
}

@media (max-width: 960px) {
  .grid-6 {
    grid-template-columns: repeat(3, 1fr);
  }
  .loved-box {
    grid-template-columns: 1fr;
  }
  .loved-row:nth-last-child(-n + 2) {
    border-bottom: 1px solid var(--rule);
  }
  .loved-row:last-child {
    border-bottom: none;
  }
  .cta-card {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .grid-6 {
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
  .cta-card {
    margin-top: 64px;
    padding: 32px 24px;
  }
  .founder {
    margin-top: 56px;
    gap: 16px;
    flex-direction: column;
  }
  .loved-row {
    grid-template-columns: 40px 56px 1fr auto;
    gap: 12px;
    padding: 12px;
  }
  .loved-rank {
    font-size: 26px;
  }
}
</style>
