<script setup lang="ts">
// SkeletonCard — shimmer placeholder for a single PaperCard while the library
// loads. Rendered by the caller *inside* the same grid that will later hold the
// real PaperCards.
//
// The geometry here deliberately mirrors PaperCard + BookCover:
//   cover  -> fixed width per size, aspect-ratio 2/3 (BookCover's exact widths)
//   title  -> two reserved lines of 14.5px/1.3 + 4px margin (.card-title)
//   meta   -> one 11px line (.card-meta)
// If any of these drift from the real card the placeholder is a different size
// than the content that replaces it, which shows up directly as CLS.
withDefaults(defineProps<{ size?: 'xs' | 'sm' | 'md' | 'lg' }>(), { size: 'md' })

// Must stay in sync with BookCover's `sizes` map.
const widths: Record<'xs' | 'sm' | 'md' | 'lg', number> = { xs: 60, sm: 120, md: 132, lg: 168 }
</script>

<template>
  <div class="sk-card" aria-hidden="true">
    <div class="sk-cover" :style="{ width: widths[size] + 'px' }" />
    <div class="sk-body">
      <div class="sk-title">
        <span class="sk-line" />
        <span class="sk-line" />
      </div>
      <div class="sk-meta">
        <span class="sk-line" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sk-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.sk-cover {
  aspect-ratio: 2 / 3;
  border-radius: 2px 6px 6px 2px;
  background: var(--paper-3);
  overflow: hidden;
  position: relative;
  flex: none;
}
.sk-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.sk-title {
  display: flex;
  flex-direction: column;
  gap: 5px;
  /* Matches .card-title exactly: two lines at 14.5px/1.3, with its 4px bottom
     margin kept as a separate margin rather than folded in here, so the total
     box height is identical to the real card's. */
  min-height: calc(2 * 14.5px * 1.3);
  margin-bottom: 4px;
}
.sk-meta {
  height: 13px;
}
.sk-line {
  display: block;
  height: 12px;
  border-radius: 4px;
  background: var(--paper-3);
  overflow: hidden;
  position: relative;
}
.sk-title .sk-line:last-child {
  width: 72%;
}
.sk-meta .sk-line {
  width: 55%;
  height: 11px;
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
@keyframes sk-shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
</style>