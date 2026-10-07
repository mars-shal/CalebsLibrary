<script setup lang="ts">
// Open banner — dismissible, ink bar across the very top of every page
import { ref } from 'vue'
import Icon from './Icon.vue'

const dismissed = ref(localStorage.getItem('calebs_banner_dismissed') === '1')

function close() {
  dismissed.value = true
  localStorage.setItem('calebs_banner_dismissed', '1')
}
</script>

<template>
  <div v-if="!dismissed" class="banner" role="banner">
    <span class="dot" aria-hidden="true" />
    <span class="copy">
      <strong>Free. Open. No account needed.</strong>
      <span class="muted">Anyone can read. Anyone can contribute.</span>
      <!-- A real <RouterLink>, not <a @click>. An anchor with no href is not
           focusable and is not announced as a link, so "How it works" was
           unreachable by keyboard. -->
      <RouterLink class="how" to="/about">How it works &rarr;</RouterLink>
    </span>
    <button class="close" aria-label="Dismiss banner" @click="close">
      <Icon name="x" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.banner {
  height: 32px;
  background: var(--surface-dark);
  color: var(--on-surface);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  position: relative;
  z-index: 60;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink-20);
  flex-shrink: 0;
}
.copy {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}
.muted {
  opacity: 0.55;
}
.how {
  opacity: 0.9;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
}
.how:hover {
  opacity: 1;
}
.close {
  margin-left: auto;
  color: var(--paper);
  opacity: 0.5;
  display: grid;
  place-items: center;
  padding: 4px;
  border-radius: 4px;
}
.close:hover {
  opacity: 1;
}
@media (max-width: 640px) {
  .muted {
    display: none;
  }
  .banner {
    gap: 8px;
    padding: 0 12px;
  }
  .copy {
    gap: 8px;
  }
}
@media (max-width: 400px) {
  .how {
    display: none;
  }
}
</style>
