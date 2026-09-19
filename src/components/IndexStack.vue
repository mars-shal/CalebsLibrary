<script setup lang="ts">
// IndexStack — layered flat cards replacing BookCover.
// 2-3 slightly fanned cards, top card front-facing with course code + note count.
import { computed } from 'vue'
import type { Paper } from '@/script/design'

type StackSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(
  defineProps<{ paper: Paper; size?: StackSize }>(),
  { size: 'md' },
)

const emit = defineEmits<{ (e: 'click'): void }>()

const sizes: Record<StackSize, { w: number; fs: number; sub: number; pad: number }> = {
  xs: { w: 60, fs: 8, sub: 6.5, pad: 6 },
  sm: { w: 120, fs: 12, sub: 9, pad: 10 },
  md: { w: 132, fs: 15, sub: 10, pad: 12 },
  lg: { w: 168, fs: 20, sub: 12, pad: 16 },
  xl: { w: 224, fs: 26, sub: 14, pad: 20 },
}

const s = computed(() => sizes[props.size])
const subjectLabel = computed(() => props.paper.subjectName || 'Notes')
</script>

<template>
  <div
    class="index-stack"
    :style="{
      width: s.w + 'px',
      '--cover-pad': s.pad + 'px',
      '--cover-fs': s.fs + 'px',
      '--cover-sub': s.sub + 'px',
    }"
    @click="emit('click')"
  >
    <!-- Back cards (depth cues) -->
    <div class="card-back card-back-2" />
    <div class="card-back card-back-1" />
    <!-- Front card -->
    <div class="card-front">
      <div class="front-rule-top" />
      <div class="front-subject">{{ subjectLabel }}</div>
      <div class="front-title">{{ paper.title }}</div>
      <div class="front-flex" />
      <div class="front-rule-bottom" />
      <div class="front-meta">{{ paper.year }} · {{ paper.pages }}pp</div>
    </div>
  </div>
</template>

<style scoped>
.index-stack {
  position: relative;
  aspect-ratio: 2 / 3;
  cursor: pointer;
  transition:
    transform var(--dur-med) var(--ease-out),
    box-shadow var(--dur-med) var(--ease-out);
}
.index-stack:hover {
  transform: translateY(-6px) rotate(-0.5deg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.08);
}
.card-back {
  position: absolute;
  inset: 0;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--bg-default);
}
.card-back-2 {
  transform: rotate(4deg) translateY(2px);
}
.card-back-1 {
  transform: rotate(2deg) translateY(1px);
}
.card-front {
  position: relative;
  z-index: 2;
  border: 1px solid var(--border-default);
  border-radius: 10px;
  background: var(--bg-elevated);
  padding: var(--cover-pad);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: var(--shadow-soft);
}
.front-rule-top,
.front-rule-bottom {
  height: 1px;
  background: var(--border-strong);
  opacity: 0.5;
}
.front-rule-top {
  margin-bottom: calc(var(--cover-pad) * 0.6);
}
.front-subject {
  font-size: var(--cover-sub);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.front-title {
  font-size: var(--cover-fs);
  line-height: 1.15;
  font-weight: 500;
  margin-top: calc(var(--cover-pad) * 0.5);
  letter-spacing: -0.015em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  color: var(--text-primary);
}
.front-flex {
  flex: 1;
}
.front-rule-bottom {
  margin-bottom: calc(var(--cover-pad) * 0.5);
}
.front-meta {
  font-size: var(--cover-sub);
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}
</style>
