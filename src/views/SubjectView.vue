<script setup lang="ts">
// Subject — department page. Ported from design_handoff Subject.jsx.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { getContributor } from '@/script/design'
import type { Paper } from '@/script/design'
import Icon from '@/components/Icon.vue'
import PaperCard from '@/components/PaperCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import Avatar from '@/components/Avatar.vue'

const drive = useDriveStore()
const route = useRoute()
const router = useRouter()

const subject = computed(() => drive.getSubject(String(route.params.id)))

const papers = computed<Paper[]>(() =>
  subject.value ? drive.papersBySubject(subject.value.id) : [],
)

const essentials = computed<Paper[]>(() => papers.value.slice(0, 4))

const contributors = computed(() => {
  const counts = new Map<string, number>()
  for (const p of papers.value) {
    counts.set(p.contributor, (counts.get(p.contributor) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([id, n]) => ({ user: getContributor(id), n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)
})

function openPaper(p: Paper) {
  router.push({ name: 'paper', params: { id: p.id } })
}
</script>

<template>
  <div class="screen-wrap">
    <!-- Hero -->
    <section v-if="subject" class="hero">
      <div class="wrap hero-inner">
        <div class="breadcrumb">
          <button class="crumb" @click="router.push({ name: 'browse' })">Library</button>
          <Icon name="chevron" :size="10" />
          <button class="crumb" @click="router.push({ name: 'browse' })">All subjects</button>
          <Icon name="chevron" :size="10" />
          <span class="crumb-current">{{ subject.name }}</span>
        </div>
        <div class="smallcaps" style="margin-bottom: 12px">Department</div>
        <h1 class="hero-title">{{ subject.name }}</h1>
        <div class="hero-stats mono-meta">
          {{ subject.count.toLocaleString() }} Papers
          <span class="dot">·</span>
          {{ contributors.length }} Contributors
          <span class="dot">·</span>
          {{ subject.courses.length }} Courses
        </div>
      </div>
    </section>

    <div class="wrap body" v-if="subject">
      <!-- Essentials -->
      <SectionHeader eyebrow="This term" title="This term's essentials" />
      <div class="grid-4">
        <PaperCard
          v-for="p in essentials"
          :key="p.id"
          :paper="p"
          size="md"
          @click="openPaper(p)"
        />
      </div>

      <!-- Courses -->
      <div class="courses-section">
        <SectionHeader eyebrow="Course list" title="Every course, every paper" />
        <div class="courses-grid">
          <button
            v-for="c in subject.courses"
            :key="c.id"
            class="course-row"
            @click="router.push({ name: 'subject', params: { id: subject.id } })"
          >
            <span class="course-accent" />
            <span class="course-name">{{ c.displayName }}</span>
            <span class="course-count mono">{{ c.paperCount }}</span>
            <Icon name="chevron" :size="14" class="course-chevron" />
          </button>
        </div>
      </div>

      <!-- All papers -->
      <div class="all-section">
        <SectionHeader eyebrow="The whole shelf" title="All papers" />
        <div class="grid-6">
          <PaperCard
            v-for="p in papers"
            :key="p.id"
            :paper="p"
            size="sm"
            @click="openPaper(p)"
          />
        </div>
      </div>

      <!-- Top contributors -->
      <div class="contrib-section">
        <SectionHeader eyebrow="Regulars" title="Top contributors" />
        <div class="contrib-grid">
          <button
            v-for="({ user, n }) in contributors"
            :key="user.id"
            class="contrib-card"
            @click="router.push({ name: 'profile', params: { id: user.id } })"
          >
            <Avatar :user="user" :size="44" />
            <div class="contrib-name">{{ user.name }}</div>
            <div class="mono-meta">{{ n }} contributions</div>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="missing">
      <div class="no-title">Department not found.</div>
      <button class="btn btn-secondary" @click="router.push({ name: 'browse' })">Browse the library</button>
    </div>
  </div>
</template>

<style scoped>
.hero {
  background: var(--paper-2);
  border-bottom: 1px solid var(--rule);
  padding: 64px 0 48px;
}
.wrap {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 32px;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-40);
  margin-bottom: 32px;
}
.crumb {
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  color: var(--ink-40);
  cursor: pointer;
}
.crumb:hover {
  color: var(--ink-100);
  text-decoration: underline;
}
.crumb-current {
  color: var(--ink-100);
}
.hero-title {
  font-size: clamp(40px, 6vw, 68px);
  font-weight: 500;
  letter-spacing: -0.035em;
  line-height: 1;
  color: var(--ink-100);
  margin: 0;
}
.hero-stats {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}
.dot {
  opacity: 0.4;
}
.body {
  padding-top: 48px;
  padding-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 64px;
}
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}
.courses-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.course-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: var(--bg-elevated);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--dur-fast);
}
.course-row:hover {
  border-color: var(--ink-100);
}
.course-accent {
  width: 3px;
  height: 28px;
  background: var(--ink-100);
  border-radius: 2px;
  flex-shrink: 0;
}
.course-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-100);
  letter-spacing: -0.005em;
}
.course-count {
  font-size: 11px;
  color: var(--ink-40);
}
.course-chevron {
  color: var(--ink-30);
}
.grid-6 {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;
}
.contrib-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.contrib-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: var(--bg-elevated);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--dur-fast);
}
.contrib-card:hover {
  border-color: var(--ink-100);
}
.contrib-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-100);
  margin-top: 4px;
}
.missing {
  padding: 96px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.no-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--ink-100);
}

@media (max-width: 960px) {
  .grid-6 {
    grid-template-columns: repeat(3, 1fr);
  }
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  .courses-grid {
    grid-template-columns: 1fr;
  }
  .contrib-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .grid-6 {
    grid-template-columns: repeat(2, 1fr);
  }
  .wrap {
    padding: 0 20px;
  }
  .hero {
    padding: 48px 0 36px;
  }
  .breadcrumb {
    margin-bottom: 24px;
    flex-wrap: wrap;
    row-gap: 6px;
  }
  .hero-stats {
    flex-wrap: wrap;
    row-gap: 6px;
  }
  .body {
    padding-top: 36px;
    gap: 48px;
  }
  .grid-4 {
    gap: 16px;
  }
  .contrib-grid {
    grid-template-columns: 1fr;
  }
  .missing {
    padding: 64px 20px;
  }
}
</style>
