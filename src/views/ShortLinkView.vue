<script setup lang="ts">
// /s/:code — resolves an in-house short link and redirects to the paper.
// A tiny standalone page so short links work on any static host (no server
// redirect rules needed); Convex supplies the code→url mapping.
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { convex, api } from '@/script/convex'

const route = useRoute()

type LinkState = 'resolving' | 'missing'
const state = ref<LinkState>('resolving')

onMounted(async () => {
  const code = typeof route.params.code === 'string' ? route.params.code : ''
  if (!code) {
    state.value = 'missing'
    return
  }
  try {
    // Fire-and-forget hit counter — never block the redirect on it.
    void convex.mutation(api.shortLink.bumpClicks, { code })
    const link = await convex.query(api.shortLink.getByCode, { code })
    if (!link) {
      state.value = 'missing'
      return
    }
    window.location.replace(link.url)
  } catch {
    state.value = 'missing'
  }
})
</script>

<template>
  <div class="short-wrap">
    <template v-if="state === 'missing'">
      <p class="short-title">That link doesn't look right.</p>
      <p class="short-sub">The short link may be mistyped or no longer exists.</p>
      <router-link class="short-btn" :to="{ name: 'home' }">Back to the library</router-link>
    </template>
    <template v-else>
      <p class="short-title">Opening the library…</p>
      <p class="short-sub">Taking you to your document.</p>
    </template>
  </div>
</template>

<style scoped>
.short-wrap {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}
.short-title {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink-100);
  margin: 0;
}
.short-sub {
  font-size: 14px;
  color: var(--ink-70);
  margin-top: 12px;
  max-width: 420px;
  line-height: 1.6;
}
.short-btn {
  margin-top: 28px;
  padding: 10px 22px;
  border-radius: 8px;
  background: var(--ink-100);
  color: var(--paper);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: opacity var(--dur-fast);
}
.short-btn:hover {
  opacity: 0.85;
}
</style>