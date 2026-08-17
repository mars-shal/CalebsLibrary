<script setup lang="ts">
defineProps<{ value: string; label: string }>()
</script>

<template>
  <div>
    <div class="stat-value">{{ value }}</div>
    <div class="smallcaps stat-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.stat-value {
  font-size: 32px;
  letter-spacing: -0.03em;
  line-height: 1;
  font-weight: 500;
  color: var(--ink-100);
}
.stat-label {
  margin-top: 6px;
  font-size: 10px;
}
</style>
