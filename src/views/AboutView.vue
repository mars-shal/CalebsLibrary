<script setup lang="ts">
// About — editorial "how it works" page. Ported from About.jsx.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import Icon from '@/components/Icon.vue'
import Ornament from '@/components/Ornament.vue'
import Avatar from '@/components/Avatar.vue'

const drive = useDriveStore()
const router = useRouter()

const RULES = [
  {
    label: 'RULE 01',
    title: 'Attribution is not optional.',
    body: 'Every paper carries the name of the person who contributed it. Take credit for your work; give credit to others\u2019.',
  },
  {
    label: 'RULE 02',
    title: 'No commercial reuse.',
    body: 'The library is a gift from the community to the community. It stays that way.',
  },
  {
    label: 'RULE 03',
    title: 'Moderators have the last word.',
    body: 'A small rotating group of contributors reviews every submission. They approve, request changes, or reject. Their decisions are appealable, but final.',
  },
]

// Moderators: take contributors with the most uploads, prefer founder first
const moderators = computed(() => {
  const list = [...drive.contributors]
  list.sort((a, b) => (b.founder ? 1 : 0) - (a.founder ? 1 : 0) || b.uploads - a.uploads)
  return list.slice(0, 8)
})
</script>

<template>
  <div class="screen-wrap about">
    <div class="smallcaps" style="margin-bottom: 16px">How it works</div>
    <h1 class="hero-title">What Caleb's Library is.</h1>
    <p class="hero-sub">
      An open, community-run collection of student notes, study guides, and papers.
      Free to read, free to contribute, run by whoever shows up.
    </p>

    <Ornament style="margin-bottom: 48px" />

    <div class="body">
      <p>
        It began, as most useful things do, as a shared folder.
        Caleb H. and three friends kept their notes in one place in 2019.
        That folder spread — first to their year, then to the years below them,
        then to departments they'd never taken.
      </p>
      <p>
        Today it holds three thousand documents.
        Every one of them was left behind by a student who wanted the next
        person to have a slightly easier time than they did.
      </p>

      <h2 class="section-title">Three rules.</h2>

      <ol class="rules">
        <li v-for="(r, i) in RULES" :key="r.label" class="rule" :class="{ bordered: i > 0 }">
          <div class="rule-label">{{ r.label }}</div>
          <div>
            <div class="rule-title">{{ r.title }}</div>
            <div class="rule-body">{{ r.body }}</div>
          </div>
        </li>
      </ol>

      <h2 class="section-title">Who runs this.</h2>
      <p>
        Nobody, and everybody. Caleb started it; a rotating group of about a dozen
        contributors keeps it running. There's no university behind it,
        no company, no ads. If it stops working, whoever's around fixes it.
      </p>
      <p>
        Uploads ask for a name and email — the email stays private and is only
        used if a moderator needs to reach you.
        There are no accounts to create, nothing to log in to. Read, upload, or leave.
      </p>

      <h2 class="section-title">Want to help.</h2>
      <p>
        Upload something. Comment on something. Flag something that shouldn't be here.
        If you want to be a moderator, contribute a dozen papers first — we ask the
        top contributors when a moderator spot opens.
      </p>
    </div>

    <!-- Moderators card -->
    <div class="moderators-card">
      <div class="smallcaps" style="margin-bottom: 20px">Current moderators</div>
      <div class="mod-grid">
        <button
          v-for="c in moderators"
          :key="c.id"
          class="mod-row"
          @click="router.push({ name: 'profile', params: { id: c.id } })"
        >
          <Avatar :user="c" :size="28" />
          <div class="mod-main">
            <div class="mod-name">{{ c.name }}</div>
            <div class="mod-handle mono-meta" style="font-size: 10px">{{ c.handle }}</div>
          </div>
        </button>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" @click="router.push({ name: 'upload' })">
        <Icon name="upload" :size="14" /> Contribute a paper
      </button>
      <button class="btn btn-secondary" @click="router.push({ name: 'browse' })">
        Browse the library
      </button>
    </div>
  </div>
</template>

<style scoped>
.about {
  max-width: 780px;
  margin: 0 auto;
  padding: 72px 32px 0;
}
.hero-title {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(48px, 9vw, 72px);
  line-height: 1;
  margin: 0;
  letter-spacing: -0.03em;
  color: var(--ink-100);
  font-weight: 500;
  text-wrap: balance;
}
.hero-sub {
  font-family: var(--font-sans);
  font-size: 20px;
  color: var(--ink-70);
  margin: 24px 0 48px;
  line-height: 1.5;
  max-width: 640px;
  letter-spacing: -0.01em;
}
.body {
  font-size: 16px;
  line-height: 1.75;
  color: var(--ink-100);
  letter-spacing: -0.005em;
}
.body p {
  margin: 0 0 20px;
}
.section-title {
  font-size: 28px;
  margin: 56px 0 20px;
  letter-spacing: -0.025em;
  color: var(--ink-100);
  font-weight: 500;
}
.rules {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rule {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 20px;
  margin-bottom: 24px;
  padding-top: 20px;
}
.rule.bordered {
  border-top: 1px solid var(--rule);
}
.rule-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-40);
  letter-spacing: 0.04em;
  padding-top: 6px;
}
.rule-title {
  font-size: 20px;
  color: var(--ink-100);
  margin-bottom: 6px;
  font-weight: 500;
  letter-spacing: -0.015em;
}
.rule-body {
  color: var(--ink-70);
  font-size: 15px;
  line-height: 1.65;
}
.moderators-card {
  margin-top: 72px;
  padding: 32px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: var(--bg-elevated);
}
.mod-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.mod-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
}
.mod-main {
  min-width: 0;
}
.mod-name {
  font-size: 12px;
  color: var(--ink-100);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mod-handle {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.actions {
  margin-top: 48px;
  margin-bottom: 96px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .about {
    padding: 48px 20px 0;
  }
  .hero-sub {
    font-size: 17px;
    margin: 20px 0 36px;
  }
  .section-title {
    font-size: 24px;
    margin: 44px 0 16px;
  }
  .mod-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .rule {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .moderators-card {
    margin-top: 56px;
    padding: 24px 20px;
  }
  .actions {
    margin-top: 36px;
    margin-bottom: 72px;
    flex-direction: column;
  }
  .actions .btn {
    width: 100%;
  }
}
</style>
