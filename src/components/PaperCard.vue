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
    <div>
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
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-out);
}
.paper-card:hover {
  transform: translateY(-2px);
}
.card-title {
  font-size: 14.5px;
  line-height: 1.3;
  font-weight: 500;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
  color: var(--ink-100);
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
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
