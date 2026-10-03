<script setup lang="ts">
// PaperCard — BookCover + title + one-line meta
import BookCover from './BookCover.vue'
import Icon from './Icon.vue'
import { formatCount } from '@/script/design'
import type { Paper } from '@/script/design'

withDefaults(defineProps<{ paper: Paper; size?: 'sm' | 'md' }>(), { size: 'md' })
defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <div class="paper-card" @click="$emit('click')">
    <BookCover :paper="paper" :size="size" @click="$emit('click')" />
    <div class="card-body">
      <div class="card-title">{{ paper.title }}</div>
      <div class="card-meta">
        <span>{{ paper.type }}</span>
        <span class="dot">·</span>
        <span class="up">
          <Icon name="arrow-up" :size="11" />{{ formatCount(paper.upvotes) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.paper-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Without this the card is sized by its longest unbreakable title, which
     pushes the whole grid track wider than 1fr and overflows the row. */
  min-width: 0;
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-out);
}
.paper-card:hover {
  transform: translateY(-2px);
}
/* flex:1 so the meta line sits at the bottom of the row; with the fixed title
   height below, every card's meta lands on the same baseline. */
.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 14.5px;
  line-height: 1.3;
  font-weight: 500;
  /* Reserve both clamped lines. Without this a one-line title makes its card
     shorter, so the meta lines in that row end up at different heights. */
  min-height: 2.6em;
  /* Break inside a long filename ("GET210_Introduction...") rather than letting
     it widen the grid track. */
  overflow-wrap: anywhere;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
  color: var(--ink-100);
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  /* Always one line — "Lecture Notes" was wrapping to two and doubling the
     height of some cards in a row. */
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-40);
  letter-spacing: 0.02em;
}
.dot {
  opacity: 0.4;
}
.up {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
</style>
