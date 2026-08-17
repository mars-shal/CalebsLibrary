<script setup lang="ts">
// 404 — fallen book stack. Ported from NotFound.jsx.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import Icon from '@/components/Icon.vue'
import BookCover from '@/components/BookCover.vue'

const drive = useDriveStore()
const router = useRouter()

const stack = computed(() => {
  const papers = drive.papers
  if (papers.length < 3) return []
  return [
    { paper: papers[3]!, cls: 'book-1', opacity: 1 },
    { paper: papers[7] ?? papers[0]!, cls: 'book-2', opacity: 0.7 },
    { paper: papers[11] ?? papers[1]!, cls: 'book-3', opacity: 0.7 },
  ]
})
</script>

<template>
  <div class="screen-wrap notfound">
    <!-- Fallen books -->
    <div class="stack">
      <div v-if="stack.length" v-for="b in stack" :key="b.paper.id" class="stack-book" :class="b.cls" :style="{ opacity: b.opacity }">
        <BookCover :paper="b.paper" :size="stack.length >= 2 && b.cls !== 'book-1' ? 'sm' : 'md'" />
      </div>
      <div v-else style="height: 240px" />
    </div>

    <div class="hero-404">404</div>

    <h1 class="title">This page wandered off the shelves.</h1>

    <p class="sub">
      Whatever you were looking for isn't here — or isn't here anymore.
      Perhaps a moderator moved it, or it was withdrawn from circulation.
    </p>

    <div class="actions">
      <button class="btn btn-primary" @click="router.push({ name: 'home' })">
        <Icon name="home" :size="14" /> Back to the library
      </button>
      <button class="btn btn-secondary" @click="router.push({ name: 'browse' })">
        Browse everything
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
  height: 240px;
  margin-bottom: 40px;
}
.stack-book {
  position: absolute;
  left: 50%;
}
.book-1 {
  transform: translateX(-50%) translateY(20px) rotate(-14deg);
  z-index: 1;
}
.book-2 {
  transform: translateX(-70%) translateY(70px) rotate(-38deg);
  z-index: 2;
}
.book-3 {
  transform: translateX(-30%) translateY(90px) rotate(24deg);
  z-index: 2;
}
.hero-404 {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(64px, 12vw, 96px);
  color: var(--ink-100);
  line-height: 1;
  margin-bottom: 16px;
  font-weight: 500;
  letter-spacing: -0.03em;
}
.title {
  font-size: clamp(28px, 5vw, 40px);
  color: var(--ink-100);
  margin: 0;
  letter-spacing: -0.025em;
  font-weight: 500;
}
.sub {
  font-size: 17px;
  color: var(--ink-70);
  margin-top: 20px;
  margin-bottom: 40px;
  line-height: 1.6;
  letter-spacing: -0.005em;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .notfound {
    padding: 80px 20px 72px;
  }
  .stack {
    height: 180px;
    margin-bottom: 32px;
  }
  .hero-404 {
    font-size: clamp(56px, 16vw, 72px);
  }
  .title {
    font-size: clamp(24px, 6.5vw, 30px);
  }
  .sub {
    font-size: 15.5px;
    margin-top: 16px;
    margin-bottom: 32px;
  }
  .actions {
    gap: 10px;
  }
  .actions .btn {
    width: 100%;
  }
}
</style>
