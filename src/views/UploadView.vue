<script setup lang="ts">
// Upload — contributions are paused. This page is kept (and the /upload route stays)
// so the flow can be re-enabled easily; the Supabase upload pipeline was removed.
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'

const router = useRouter()
</script>

<template>
  <div class="screen-wrap upload">
    <div class="header">
      <div class="smallcaps" style="margin-bottom: 12px">Contribute</div>
      <h1 class="title">Adding new papers is paused.</h1>
      <p class="sub">
        We're reworking how contributions enter the library, so the upload flow is temporarily
        offline. Everything already on the shelves stays readable and searchable — nothing is
        going away.
      </p>
    </div>

    <div class="paused-card">
      <div class="paused-icon"><Icon name="info" :size="22" /></div>
      <div class="paused-title">What this means</div>
      <div class="paused-sub">
        Your notes can't be added to the library right now. When contributions reopen, the flow
        will look similar — upload a file, add details, and a moderator reviews before it goes
        live.
      </div>
      <div class="step-nav">
        <button class="btn btn-primary" @click="router.push({ name: 'home' })">
          Browse the library <Icon name="arrow-right" :size="14" />
        </button>
        <button class="btn btn-secondary" @click="router.push({ name: 'about' })">
          Read about how the library works
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload {
  max-width: 780px;
  margin: 0 auto;
  padding: 48px 32px;
}
.title {
  font-size: 44px;
  margin: 0;
  color: var(--ink-100);
  letter-spacing: -0.03em;
  line-height: 1.05;
  font-weight: 500;
}
.sub {
  color: var(--ink-70);
  font-size: 15px;
  margin-top: 12px;
  max-width: 560px;
  line-height: 1.55;
}
.paused-card {
  margin-top: 40px;
  padding: 32px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--bg-elevated);
}
.paused-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 20px;
  display: grid;
  place-items: center;
  background: var(--paper-2);
  border-radius: 50%;
  color: var(--ink-100);
}
.paused-title {
  font-size: 24px;
  color: var(--ink-100);
  font-weight: 500;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}
.paused-sub {
  color: var(--ink-70);
  font-size: 14px;
  line-height: 1.55;
  max-width: 460px;
  margin-bottom: 28px;
}
.step-nav {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .upload {
    padding: 32px 20px;
  }
  .title {
    font-size: 34px;
  }
  .paused-card {
    padding: 24px 20px;
  }
}
</style>