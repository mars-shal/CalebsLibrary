<script setup lang="ts">
// SkeletonCard — pulse placeholder. NOT shimmer.
withDefaults(defineProps<{ count?: number; size?: 'xs' | 'sm' | 'md' | 'lg' }>(), {
  count: 1,
  size: 'md',
})
</script>

<template>
  <div class="skeleton-grid">
    <div v-for="i in count" :key="i" class="sk-card">
      <div class="sk-stack">
        <div class="sk-card-back" />
        <div class="sk-card-back sk-card-back-2" />
        <div class="sk-card-front" :class="`sk-${size}`">
          <div class="sk-line sk-short" />
          <div class="sk-line sk-long" />
          <div class="sk-spacer" />
          <div class="sk-line sk-short" />
        </div>
      </div>
      <div class="sk-text">
        <div class="sk-line sk-title" />
        <div class="sk-line sk-meta" />
      </div>
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
.sk-stack {
  position: relative;
  aspect-ratio: 2 / 3;
}
.sk-card-back {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: var(--bg-default);
  border: 1px solid var(--rule);
}
.sk-card-back-2 {
  transform: rotate(3deg) translateY(1px);
}
.sk-card-front {
  position: relative;
  z-index: 1;
  border-radius: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  animation: pulse 2s ease-in-out infinite;
}
.sk-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sk-line {
  height: 10px;
  border-radius: 3px;
  background: var(--bg-default);
  animation: pulse 2s ease-in-out infinite;
}
.sk-short { width: 40%; }
.sk-long { width: 70%; }
.sk-spacer { flex: 1; }
.sk-title { width: 85%; height: 12px; }
.sk-meta { width: 50%; height: 10px; }
.sk-xs { width: 68px; }
.sk-sm { width: 92px; }
.sk-md { width: 132px; }
.sk-lg { width: 180px; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@media (max-width: 960px) {
  .skeleton-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
