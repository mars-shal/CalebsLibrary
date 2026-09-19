<script setup lang="ts">
// TopStrip — minimal floating nav. NOT the old sticky strip.
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from './Icon.vue'

const router = useRouter()
const route = useRoute()

const THEME_KEY = 'bellsnotes_theme'
function getTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'light'
}
const theme = ref<'light' | 'dark'>(getTheme())

function applyTheme(t: 'light' | 'dark') {
  theme.value = t
  document.documentElement.classList.toggle('dark', t === 'dark')
  localStorage.setItem(THEME_KEY, t)
}
applyTheme(theme.value)

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

function goHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="nav">
    <div class="nav-inner">
      <!-- Logo -->
      <button class="nav-logo" @click="goHome" aria-label="Bells Notes — home">
        <span class="logo-bells">Bells</span>
        <span class="logo-notes">Notes</span>
      </button>

      <!-- Center nav -->
      <nav class="nav-center" v-if="route.name !== 'home'">
        <button class="nav-item" :class="{ active: route.name === 'browse' }" @click="router.push('/browse')">Browse</button>
        <button class="nav-item" :class="{ active: route.name === 'search' }" @click="router.push({ name: 'search' })">Search</button>
        <button class="nav-item" :class="{ active: route.name === 'upload' }" @click="router.push({ name: 'upload' })">Upload</button>
      </nav>

      <!-- Right actions -->
      <div class="nav-actions">
        <button class="nav-icon-btn" @click="router.push('/about')" aria-label="About">
          <Icon name="info" :size="18" />
        </button>
        <button class="nav-icon-btn" @click="toggleTheme" :aria-label="theme === 'dark' ? 'Light mode' : 'Dark mode'">
          <Icon :name="theme === 'dark' ? 'sun' : 'moon'" :size="18" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(250, 250, 250, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-default);
}
html.dark .nav {
  background: rgba(10, 10, 10, 0.85);
}
.nav-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 32px;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 24px;
}

/* Logo */
.nav-logo {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 0;
  flex-shrink: 0;
}
.logo-bells {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 600;
  font-style: italic;
  color: var(--text-primary);
  line-height: 1;
}
.logo-notes {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

/* Center nav */
.nav-center {
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-item {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 999px;
  transition: all var(--dur-fast);
}
.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-default);
}
.nav-item.active {
  color: var(--text-primary);
  background: var(--text-primary);
  color: var(--bg-default);
}

/* Right actions */
.nav-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-icon-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: var(--text-secondary);
  transition: all var(--dur-fast);
}
.nav-icon-btn:hover {
  color: var(--text-primary);
  background: var(--bg-default);
}

@media (max-width: 720px) {
  .nav-inner { padding: 0 16px; gap: 12px; }
  .nav-center { display: none; }
}
</style>
