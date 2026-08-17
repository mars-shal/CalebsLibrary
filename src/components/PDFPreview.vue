<script setup lang="ts">
// PDFPreview — renders the REAL document via Drive embed when src is given,
// otherwise a stylized mock page (design reference fidelity).
import { computed } from 'vue'
import type { Paper } from '@/script/design'

const props = withDefaults(defineProps<{ paper: Paper; height?: number; src?: string }>(), {
  height: 520,
  src: '',
})

const iframeSrc = computed(() => props.src || props.paper.previewUrl)
</script>

<template>
  <div class="pdf-preview" :style="{ height: height + 'px' }">
    <iframe
      v-if="iframeSrc"
      :src="iframeSrc"
      class="pdf-frame"
      title="Document preview"
      allow="fullscreen"
    />
    <div v-else class="pdf-mock">
      <div class="smallcaps" style="margin-bottom: 32px; font-size: 10px">
        Caleb's Library · {{ paper.subjectName }}
      </div>
      <div class="mock-title">{{ paper.title }}</div>
      <div class="mock-sub">{{ paper.subtitle }}</div>
      <div class="mock-mono mono">{{ paper.teacher }} · {{ paper.year }}</div>
      <div class="mock-rule" />
      <div class="mock-body">
        <div class="mock-heading">1. Introduction</div>
        <div v-for="w in [100, 92, 96, 88, 74]" :key="w" class="mock-line" :style="{ width: w + '%' }" />
        <div style="height: 12px" />
        <div v-for="w in [95, 100, 91, 68]" :key="w" class="mock-line" :style="{ width: w + '%' }" />
        <div style="height: 20px" />
        <div class="mock-heading">2. Core Concepts</div>
        <div v-for="w in [100, 87, 93, 82, 96, 71]" :key="w" class="mock-line" :style="{ width: w + '%' }" />
      </div>
      <div class="mock-flex" />
      <div class="mock-page">— 1 —</div>
    </div>
  </div>
</template>

<style scoped>
.pdf-preview {
  background: var(--bg-pdf);
  border-radius: 4px;
  box-shadow: var(--shadow-book);
  border: 1px solid var(--rule);
  overflow: hidden;
  position: relative;
}
.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--bg-pdf);
}
.pdf-mock {
  padding: 40px 44px;
  color: var(--ink-100);
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
}
.mock-title {
  font-size: 30px;
  line-height: 1.1;
  margin-bottom: 8px;
  font-weight: 500;
  letter-spacing: -0.02em;
}
.mock-sub {
  font-size: 14px;
  color: var(--ink-40);
  margin-bottom: 4px;
}
.mock-mono {
  color: var(--ink-30);
  margin-bottom: 24px;
}
.mock-rule {
  height: 1px;
  background: var(--rule-strong);
  margin-bottom: 24px;
}
.mock-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mock-heading {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}
.mock-line {
  height: 8px;
  background: var(--ink-100);
  opacity: 0.09;
  border-radius: 2px;
}
.mock-flex {
  flex: 1;
}
.mock-page {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-40);
  border-top: 1px solid var(--rule);
  padding-top: 12px;
}
</style>
