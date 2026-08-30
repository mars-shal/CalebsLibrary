<script setup lang="ts">
// SkeletonCard — shimmer placeholder for paper cards while the library loads.
withDefaults(defineProps<{ count?: number; size?: 'xs' | 'sm' | 'md' | 'lg' }>(), {
  count: 1,
  size: 'md',
})
</script>

<template>
  <div class="skeleton-grid">
    <div v-for="i in count" :key="i" class="sk-card">
      <div class="sk-cover" :class="`sk-${size}`" />
      <div class="sk-line sk-title" />
      <div class="sk-line sk-meta" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;
}
.sk-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sk-cover {
  aspect-ratio: 2 / 3;
  border-radius: 2px 6px 6px 2px;
  background: var(--paper-3);
  overflow: hidden;
  position: relative;
}
.sk-line {
  height: 12px;
  border-radius: 4px;
  background: var(--paper-3);
  overflow: hidden;
  position: relative;
}
.sk-title {
  width: 85%;
}
.sk-meta {
  width: 55%;
  height: 10px;
}
.sk-cover::after,
.sk-line::after {
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
.sk-xs {
  width: 68px;
}
.sk-sm {
  width: 92px;
}
.sk-md {
  width: 132px;
}
.sk-lg {
  width: 180px;
}
@keyframes sk-shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
@media (max-width: 960px) {
  .skeleton-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 640px) {
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>