<script setup lang="ts">
// SectionHeader — eyebrow + title left, optional action right
withDefaults(defineProps<{ eyebrow?: string; title: string }>(), { eyebrow: '' })
</script>

<template>
  <div class="section-header">
    <div>
      <div v-if="eyebrow" class="smallcaps" style="margin-bottom: 6px">{{ eyebrow }}</div>
      <div class="section-title">{{ title }}</div>
    </div>
    <div class="action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}
.section-title {
  font-size: 26px;
  letter-spacing: -0.02em;
  font-weight: 500;
  line-height: 1.1;
  color: var(--ink-100);
}
.action {
  flex-shrink: 0;
}
</style>
