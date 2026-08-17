<script setup lang="ts">
// Profile — public contributor page. Ported from Profile.jsx.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { getContributor } from '@/script/design'
import type { Paper } from '@/script/design'
import Icon from '@/components/Icon.vue'
import PaperCard from '@/components/PaperCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import Stat from '@/components/Stat.vue'
import Avatar from '@/components/Avatar.vue'

const drive = useDriveStore()
const route = useRoute()
const router = useRouter()

const user = computed(() => getContributor(String(route.params.id)))

const papers = computed<Paper[]>(() =>
  drive.papers.filter((p) => p.contributor === user.value.id),
)

const tab = ref<'papers' | 'shelves' | 'about'>('papers')
const tabs = computed(() => [
  { id: 'papers' as const, label: `Papers (${papers.value.length})` },
  { id: 'shelves' as const, label: 'Curated shelves' },
  { id: 'about' as const, label: 'About' },
])

const shelves = [
  { name: 'Beowulf & Old English', count: 8 },
  { name: 'Modernist essays', count: 12 },
  { name: 'First-year survival', count: 6 },
]

const reads = computed(() => (user.value.uploads * 187).toLocaleString())
const firstName = computed(() => user.value.name.split(' ')[0] ?? user.value.name)

function openPaper(p: Paper) {
  router.push({ name: 'paper', params: { id: p.id } })
}
</script>

<template>
  <div class="screen-wrap">
    <!-- Hero -->
    <section class="hero">
      <div class="wrap hero-inner">
        <Avatar :user="user" :size="96" />
        <div class="hero-main">
          <div class="smallcaps" style="margin-bottom: 8px">
            Contributor <template v-if="user.founder">· Founder</template>
          </div>
          <h1 class="name">{{ user.name }}</h1>
          <div class="bio">{{ user.bio }}</div>
          <div class="tags">
            <span class="tag">{{ user.handle }}</span>
            <span v-if="user.founder" class="tag tag-found">{{ user.name.split(' ')[0] }} · Founder</span>
          </div>
        </div>
        <div class="stats">
          <Stat :value="String(user.uploads)" label="Contributions" />
          <Stat :value="reads" label="Reads" />
        </div>
      </div>
    </section>

    <div class="wrap body">
      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Papers -->
      <div v-if="tab === 'papers'">
        <SectionHeader eyebrow="On the shelf" title="Contributed papers" />
        <div class="grid-4">
          <PaperCard
            v-for="p in papers"
            :key="p.id"
            :paper="p"
            size="md"
            @click="openPaper(p)"
          />
          <div v-for="i in Math.max(0, 4 - papers.length)" :key="'empty' + i" class="empty-slot">
            Empty slot
          </div>
        </div>
      </div>

      <!-- Shelves -->
      <div v-else-if="tab === 'shelves'">
        <SectionHeader eyebrow="Personal collections" title="Curated shelves" />
        <div class="grid-3">
          <button
            v-for="s in shelves"
            :key="s.name"
            class="shelf-card"
            @click="router.push({ name: 'browse' })"
          >
            <Icon name="books" :size="20" style="color: var(--ink-100); margin-bottom: 16px" />
            <div class="shelf-name">{{ s.name }}</div>
            <div class="mono-meta" style="margin-top: 6px">{{ s.count }} papers</div>
          </button>
        </div>
      </div>

      <!-- About -->
      <div v-else class="about-col">
        <SectionHeader eyebrow="Notes on a contributor" :title="`About ${firstName}`" />
        <div class="about-card">
          {{ user.bio }}
          <br /><br />
          Contributor since 2023. Uploads mostly at the end of each semester, when whatever carried
          them through gets passed forward.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  background: var(--paper-2);
  border-bottom: 1px solid var(--rule);
  padding: 56px 0 40px;
}
.wrap {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 32px;
}
.hero-inner {
  display: flex;
  gap: 32px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.hero-main {
  flex: 1;
  min-width: 280px;
}
.name {
  font-size: clamp(36px, 5vw, 52px);
  line-height: 1;
  margin: 0;
  color: var(--ink-100);
  letter-spacing: -0.035em;
  font-weight: 500;
}
.bio {
  margin-top: 12px;
  color: var(--ink-70);
  font-size: 15px;
  max-width: 520px;
  line-height: 1.55;
}
.tags {
  margin-top: 14px;
  display: flex;
  gap: 6px;
}
.tag-found {
  background: var(--ink-100);
  color: var(--paper);
  border-color: var(--ink-100);
}
.stats {
  display: flex;
  gap: 40px;
}

.body {
  padding-top: 40px;
  padding-bottom: 32px;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 32px;
}
.tab {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-40);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color var(--dur-fast);
}
.tab:hover {
  color: var(--ink-100);
}
.tab.active {
  color: var(--ink-100);
  border-bottom-color: var(--ink-100);
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}
.empty-slot {
  aspect-ratio: 2 / 3;
  border: 1px dashed var(--rule-strong);
  border-radius: 4px;
  display: grid;
  place-items: center;
  color: var(--ink-30);
  font-size: 12px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.shelf-card {
  padding: 24px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: var(--bg-elevated);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--dur-fast);
}
.shelf-card:hover {
  border-color: var(--ink-100);
}
.shelf-name {
  font-size: 20px;
  color: var(--ink-100);
  font-weight: 500;
  letter-spacing: -0.015em;
}

.about-col {
  max-width: 640px;
}
.about-card {
  padding: 32px;
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: 6px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink-100);
}

@media (max-width: 960px) {
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  .grid-3 {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .wrap {
    padding: 0 20px;
  }
  .hero {
    padding: 40px 0 32px;
  }
  .hero-inner {
    gap: 20px;
  }
  .hero-main {
    min-width: 0;
    flex-basis: 100%;
  }
  .stats {
    gap: 24px;
  }
  .tabs {
    overflow-x: auto;
    scrollbar-width: none;
    margin-left: -20px;
    margin-right: -20px;
    padding: 0 20px;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }
  .body {
    padding-top: 32px;
  }
  .grid-4 {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .about-card {
    padding: 24px 20px;
  }
}
</style>
