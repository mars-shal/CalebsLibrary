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
  <AppBanner />
  <TopStrip />
  <main class="screen-wrap" :key="route.fullPath">
    <RouterView />
  </main>
  <AppFooter />
</template>
