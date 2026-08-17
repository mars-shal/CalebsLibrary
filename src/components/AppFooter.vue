<script setup lang="ts">
// Footer — 4-column link grid + bottom mono row
import { useRouter } from 'vue-router'

const router = useRouter()

const columns: { label: string; links: { label: string; to?: string }[] }[] = [
  {
    label: 'Library',
    links: [
      { label: 'Browse everything', to: '/browse' },
      { label: 'Search', to: '/search' },
      { label: 'Contribute a paper', to: '/upload' },
      { label: 'Moderation queue', to: '/admin' },
    ],
  },
  {
    label: 'Community',
    links: [
      { label: 'About', to: '/about' },
      { label: 'How it works', to: '/about' },
      { label: 'Contributors', to: '/browse' },
      { label: 'Founder’s note', to: '/profile/caleb' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { label: 'Privacy', to: '/about' },
      { label: 'Terms', to: '/about' },
      { label: 'Content policy', to: '/about' },
      { label: 'Contact', to: '/about' },
    ],
  },
]
</script>

<template>
  <footer class="footer">
    <div class="inner">
      <div class="grid">
        <div class="brand">
          <div class="brand-logo">
            <span class="logo-serif">Caleb's</span>
            <span class="logo-caps">Library</span>
          </div>
          <p class="brand-copy">
            An open, community-run library of student notes, study guides, and papers.
            Free to read. Free to contribute. No account needed.
          </p>
        </div>
        <div v-for="col in columns" :key="col.label" class="col">
          <div class="smallcaps col-label">{{ col.label }}</div>
          <div class="col-links">
            <a
              v-for="link in col.links"
              :key="link.label"
              class="footer-link"
              @click="link.to && router.push(link.to)"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
      <div class="bottom">
        <span class="mono">© 2026 · Caleb's Library · A community project</span>
        <span class="mono tagline">Made with care. Kept alive by contributors.</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--paper-2);
  border-top: 1px solid var(--rule);
  margin-top: 96px;
}
.inner {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 48px 32px 32px;
}
.grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
}
.brand-logo {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}
.logo-serif {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 500;
  font-style: italic;
  color: var(--ink-100);
}
.logo-caps {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: var(--ink-40);
  text-transform: uppercase;
}
.brand-copy {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--ink-70);
  max-width: 340px;
}
.col-label {
  margin-bottom: 14px;
}
.col-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.footer-link {
  font-size: 13px;
  color: var(--ink-70);
  cursor: pointer;
  width: fit-content;
  transition: color var(--dur-fast);
}
.footer-link:hover {
  color: var(--ink-100);
}
.bottom {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--ink-40);
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 560px) {
  .inner {
    padding: 40px 20px 28px;
  }
  .grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
