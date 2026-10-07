<script setup lang="ts">
// Footer — one row: wordmark, a short link line, copyright
import { useRouter } from 'vue-router'

const router = useRouter()

const links: { label: string; to: string }[] = [
  { label: 'Shelves', to: '/shelves' },
  { label: 'Search', to: '/search' },
  { label: 'Contribute', to: '/upload' },
  { label: 'About', to: '/about' },
]
</script>

<template>
  <footer class="footer">
    <div class="inner">
      <div class="brand">
        <span class="logo-serif">Caleb's</span>
        <span class="logo-caps">Library</span>
      </div>
      <nav class="links" aria-label="Footer">
        <a
          v-for="link in links"
          :key="link.label"
          class="footer-link"
          @click="router.push(link.to)"
        >
          {{ link.label }}
        </a>
      </nav>
      <span class="mono copyright">© 2026 · Community project</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--paper-2);
  border-top: 1px solid var(--rule);
  margin-top: 64px;
}
.inner {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.logo-serif {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 500;
  font-style: italic;
  color: var(--ink-100);
}
.logo-caps {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: var(--ink-40);
  text-transform: uppercase;
}
.links {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
.footer-link {
  font-size: 12.5px;
  color: var(--ink-70);
  cursor: pointer;
  transition: color var(--dur-fast);
}
.footer-link:hover {
  color: var(--ink-100);
}
.copyright {
  color: var(--ink-40);
}
@media (max-width: 640px) {
  .inner {
    padding: 18px 20px;
    justify-content: center;
    text-align: center;
  }
}
</style>
