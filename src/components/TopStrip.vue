<script setup lang="ts">
// Top strip — sticky nav with logo, mini search (hidden on Home), actions
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchAutocomplete } from '@/composables/useSearchAutocomplete'
import Icon from './Icon.vue'

const router = useRouter()
const route = useRoute()
const {
  query,
  suggestions,
  showDropdown,
  highlightedIndex,
  selectSuggestion,
  handleKeydown,
  containerRef,
  onInput,
} = useSearchAutocomplete()

const THEME_KEY = 'calebs_theme'
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
// Apply on load
applyTheme(theme.value)

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

function goHome() {
  router.push({ name: 'home' })
}

function handleBlur(): void {
  window.setTimeout(() => {
    showDropdown.value = false
    highlightedIndex.value = -1
  }, 120)
}
</script>

<template>
  <header class="strip">
    <div class="inner">
      <button class="logo" @click="goHome" aria-label="Caleb's Library — home">
        <span class="logo-serif">Caleb's</span>
        <span class="logo-caps">Library</span>
      </button>

      <div
        v-if="route.name !== 'home'"
        ref="containerRef"
        class="mini-search"
        :class="{ 'dropdown-open': showDropdown && suggestions.length }"
      >
        <Icon name="search" :size="15" class="search-icon" />
        <input
          v-model="query"
          type="search"
          autocomplete="off"
          placeholder="Search the library…"
          aria-label="Search the library"
          @input="onInput"
          @keydown="handleKeydown"
          @focus="onInput"
          @blur="handleBlur"
        />
        <div v-if="showDropdown && suggestions.length" class="autocomplete-dropdown">
          <button
            v-for="(s, i) in suggestions"
            :key="s.text + s.type"
            class="ac-item"
            :class="{ highlighted: highlightedIndex === i }"
            @mousedown.prevent="selectSuggestion(s.text)"
            @mouseenter="highlightedIndex = i"
          >
            <Icon :name="s.icon" :size="14" class="ac-icon" />
            <span class="ac-text">{{ s.text }}</span>
            <span class="ac-badge">{{ s.type }}</span>
          </button>
        </div>
      </div>

      <nav class="actions">
        <button class="nav-link" @click="router.push('/browse')">Browse</button>
        <button class="nav-link" @click="router.push('/about')">About</button>
        <button
          class="theme-toggle"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <Icon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
        </button>
        <button class="btn btn-primary contribute" @click="router.push('/upload')">
          <Icon name="plus" :size="14" />
          Contribute
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.strip {
  position: sticky;
  top: 0;
  height: 56px;
  background: rgba(245, 242, 234, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--rule);
  z-index: 50;
}
.inner {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 32px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 24px;
}
.logo {
  display: flex;
  align-items: baseline;
  gap: 8px;
  cursor: pointer;
  padding: 0;
  background: none;
  flex-shrink: 0;
}
.logo-serif {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
  font-style: italic;
  color: var(--ink-100);
  line-height: 1;
}
.logo-caps {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: var(--ink-40);
  text-transform: uppercase;
}
.mini-search {
  position: relative;
  flex: 1;
  max-width: 360px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--ink-0);
  border: 1px solid var(--rule-strong);
  border-radius: 6px;
  padding: 6px 12px;
  transition: border-color var(--dur-fast);
}
.mini-search:focus-within {
  border-color: var(--ink-100);
}
.mini-search.dropdown-open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.search-icon {
  color: var(--ink-30);
  flex-shrink: 0;
}
.mini-search input {
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--ink-100);
  width: 100%;
  min-width: 0;
}
.mini-search input::placeholder {
  color: var(--ink-30);
}
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-book);
  overflow: hidden;
  z-index: 100;
  max-height: 320px;
  overflow-y: auto;
}
.ac-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition: background var(--dur-fast);
}
.ac-item:hover,
.ac-item.highlighted {
  background: var(--paper-2);
}
.ac-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.ac-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-badge {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-quiet);
  background: var(--paper-3);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}
.actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-link {
  padding: 8px 12px;
  font-size: 13.5px;
  color: var(--text-secondary);
  border-radius: var(--r-sm);
  transition: color var(--dur-fast), background var(--dur-fast);
}
.nav-link:hover {
  color: var(--text-primary);
  background: var(--paper-2);
}
.contribute {
  margin-left: 8px;
}
.theme-toggle {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--r-sm);
  color: var(--text-secondary);
  transition: color var(--dur-fast), background var(--dur-fast);
}
.theme-toggle:hover {
  color: var(--text-primary);
  background: var(--paper-2);
}
@media (max-width: 720px) {
  .inner {
    padding: 0 16px;
    gap: 12px;
  }
  .nav-link {
    display: none;
  }
}
@media (max-width: 480px) {
  .mini-search {
    display: none;
  }
  .logo-serif {
    font-size: 20px;
  }
  .logo-caps {
    display: none;
  }
  .contribute {
    margin-left: 0;
    padding: 9px 14px;
    font-size: 13px;
  }
}
</style>
