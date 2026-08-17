<script setup lang="ts">
// Avatar — always monochromatic: ink-100 bg, paper text
import { computed } from 'vue'
import type { Contributor } from '@/script/design'

const props = withDefaults(defineProps<{ user?: Contributor | null; name?: string; size?: number }>(), {
  size: 32,
})

const initials = computed(() => {
  if (props.user?.initials) return props.user.initials
  if (props.name) {
    const parts = props.name.trim().split(/\s+/)
    return parts
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return '?'
})
</script>

<template>
  <div v-if="user || name" class="avatar" :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.42 + 'px' }">
    {{ initials }}
  </div>
</template>
