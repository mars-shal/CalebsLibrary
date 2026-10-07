<script setup lang="ts">
// App shell — open banner + top strip + routed screen + footer
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppBanner from '@/components/AppBanner.vue'
import TopStrip from '@/components/TopStrip.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useDriveStore } from '@/stores/drive'

const route = useRoute()
const drive = useDriveStore()

onMounted(() => {
  drive.load()
})
</script>

<template>
  <!-- Column shell so the footer sits on the viewport floor instead of riding up
       under short pages, where it previously floated mid-screen. -->
  <div class="app-shell">
    <AppBanner />
    <TopStrip />
    <main class="screen-wrap" :key="route.fullPath">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* dvh tracks the collapsing mobile URL bar; vh stays as the older fallback. */
  min-height: 100dvh;
}
.screen-wrap {
  flex: 1 0 auto;
}
</style>
