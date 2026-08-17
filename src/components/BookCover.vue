<script setup lang="ts">
// BookCover — the signature visual: aged-paper grain, spine strip, hover lift.
// Ported from design_handoff shared.jsx BookCover
import { computed } from 'vue'
import { COVERS } from '@/script/design'
import type { Paper } from '@/script/design'

type CoverSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(
  defineProps<{ paper: Paper; size?: CoverSize }>(),
  { size: 'md' },
)

const emit = defineEmits<{ (e: 'click'): void }>()

const sizes: Record<CoverSize, { w: number; fs: number; sub: number; pad: number }> = {
  xs: { w: 68, fs: 8, sub: 6.5, pad: 6 },
  sm: { w: 92, fs: 11, sub: 8, pad: 8 },
  md: { w: 132, fs: 15, sub: 10, pad: 12 },
  lg: { w: 180, fs: 20, sub: 12, pad: 16 },
  xl: { w: 240, fs: 26, sub: 14, pad: 20 },
}

const s = computed(() => sizes[props.size])
const cover = computed(() => COVERS[props.paper.cover % COVERS.length]!)
const subjectLabel = computed(() => props.paper.subjectName || 'Notes')
</script>

<template>
  <div
    class="book-cover"
    :style="{
      width: s.w + 'px',
      background: cover.bg,
      cursor: 'pointer',
      '--cover-ink': cover.ink,
      '--cover-accent': cover.accent,
      '--cover-pad': s.pad + 'px',
      '--cover-fs': s.fs + 'px',
      '--cover-sub': s.sub + 'px',
    }"
    @click="emit('click')"
  >
    <div class="cover-inner">
      <div class="cover-rule-top" />
      <div class="cover-subject">{{ subjectLabel }}</div>
      <div class="cover-title">{{ paper.title }}</div>
      <div class="cover-flex" />
      <div class="cover-rule-bottom" />
      <div class="cover-meta">{{ paper.year }} · {{ paper.pages }}pp</div>
    </div>
  </div>
</template>

<style scoped>
.cover-inner {
  position: absolute;
  inset: 0;
  padding: var(--cover-pad) var(--cover-pad) var(--cover-pad) calc(var(--cover-pad) + 8px);
  display: flex;
  flex-direction: column;
  color: var(--cover-ink);
}
.cover-rule-top,
.cover-rule-bottom {
  height: 1px;
  background: var(--cover-accent);
  opacity: 0.5;
}
.cover-rule-top {
  margin-bottom: calc(var(--cover-pad) * 0.6);
}
.cover-subject {
  font-size: var(--cover-sub);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--cover-accent);
  opacity: 0.95;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cover-title {
  font-size: var(--cover-fs);
  line-height: 1.15;
  font-weight: 500;
  margin-top: calc(var(--cover-pad) * 0.5);
  letter-spacing: -0.015em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}
.cover-flex {
  flex: 1;
}
.cover-rule-bottom {
  margin-bottom: calc(var(--cover-pad) * 0.5);
}
.cover-meta {
  font-size: var(--cover-sub);
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  opacity: 0.8;
}
</style>
