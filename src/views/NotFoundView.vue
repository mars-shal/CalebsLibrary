<script setup lang="ts">
// 404 — scattered index-stack cards. Not fallen books.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import Icon from '@/components/Icon.vue'
import IndexStack from '@/components/IndexStack.vue'

const drive = useDriveStore()
const router = useRouter()

const stack = computed(() => {
  const papers = drive.papers.slice(0, 3)
  return papers.map((paper, i) => ({
    paper,
    cls: ['card-1', 'card-2', 'card-3'][i]!,
    opacity: i === 0 ? 1 : 0.6,
  }))
})
</script>

<template>
  <div class="screen-wrap notfound">
    <!-- Scattered cards -->
    <div class="stack">
      <template v-if="stack.length">
        <div v-for="b in stack" :key="b.paper.id" class="stack-card" :class="b.cls" :style="{ opacity: b.opacity }">
          <IndexStack :paper="b.paper" :size="b.cls === 'card-1' ? 'md' : 'sm'" />
        </div>
      </template>
      <div v-else style="height: 200px" />
    </div>

    <div class="hero-404">404</div>

    <h1 class="title">Lost in the stacks.</h1>

    <p class="sub">
      This page doesn't exist — or it was moved somewhere else.
    </p>

    <div class="actions">
      <button class="btn btn-primary" @click="router.push({ name: 'home' })">
        <Icon name="home" :size="14" /> Go home
      </button>
      <button class="btn btn-secondary" @click="router.push({ name: 'browse' })">
        Browse
      </button>
    </div>
  </div>
</template>

<style scoped>
.notfound {
  max-width: 720px;
  text-align: center;
  margin: 0 auto;
  padding: 120px 32px 96px;
}
.stack {
  position: relative;
  height: 200px;
  margin-bottom: 40px;
}
.stack-card {
  position: absolute;
  left: 50%;
}
.card-1 {
  transform: translateX(-50%) translateY(10px) rotate(-8deg);
  z-index: 1;
}
.card-2 {
  transform: translateX(-70%) translateY(50px) rotate(-22deg);
  z-index: 2;
}
.card-3 {
  transform: translateX(-30%) translateY(60px) rotate(16deg);
  z-index: 2;
}
.hero-404 {
  font-family: var(--font-mono);
  font-size: clamp(56px, 10vw, 80px);
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 16px;
  font-weight: 700;
  letter-spacing: -0.04em;
}
.title {
  font-size: clamp(24px, 4vw, 36px);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.025em;
  font-weight: 600;
}
.sub {
  font-size: 16px;
  color: var(--text-secondary);
  margin-top: 16px;
  margin-bottom: 40px;
  line-height: 1.6;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
@media (max-width: 640px) {
  .notfound { padding: 80px 20px 72px; }
  .stack { height: 160px; margin-bottom: 32px; }
  .hero-404 { font-size: clamp(48px, 14vw, 64px); }
  .title { font-size: clamp(22px, 6vw, 28px); }
  .actions { flex-direction: column; }
  .actions .btn { width: 100%; }
}
</style>
