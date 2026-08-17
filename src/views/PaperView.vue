<script setup lang="ts">
// Paper detail — preview, citation, discussion. Ported from PaperDetail.jsx.
// Uses REAL Drive data: iframe preview via paper.previewUrl, real download URL.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { getContributor, formatCount, timeAgo } from '@/script/design'
import type { Paper } from '@/script/design'
import Icon from '@/components/Icon.vue'
import BookCover from '@/components/BookCover.vue'
import Avatar from '@/components/Avatar.vue'
import PDFPreview from '@/components/PDFPreview.vue'

const drive = useDriveStore()
const route = useRoute()
const router = useRouter()

const paper = computed<Paper | undefined>(() => drive.getPaper(String(route.params.id)))
const contributor = computed(() => (paper.value ? getContributor(paper.value.contributor) : undefined))
const subject = computed(() => (paper.value ? drive.getSubject(paper.value.subject) : undefined))

onMounted(() => {
  if (paper.value) drive.recordMetric(paper.value.id, 'reads')
})

const related = computed<Paper[]>(() =>
  drive.papers
    .filter((p) => paper.value && p.subject === paper.value.subject && p.id !== paper.value.id)
    .slice(0, 4),
)

const tab = ref<'preview' | 'citation' | 'comments'>('preview')
const tabs = computed(() => [
  { id: 'preview' as const, label: 'Preview' },
  { id: 'citation' as const, label: 'Citation' },
  { id: 'comments' as const, label: `Discussion (${comments.value.length})` },
])
const voted = ref<0 | 1 | -1>(0)
const saved = ref(false)
const copied = ref<string | null>(null)
const commentBody = ref('')
const commentName = ref('')

// saved state — mirror of localStorage calebsLibraryBookmarks
function readSaved(): string[] {
  try {
    const raw = localStorage.getItem('calebsLibraryBookmarks')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}
function toggleSaved() {
  if (!paper.value) return
  const list = readSaved()
  saved.value = !saved.value
  const next = saved.value
    ? [...new Set([...list, paper.value.id])]
    : list.filter((id) => id !== paper.value!.id)
  localStorage.setItem('calebsLibraryBookmarks', JSON.stringify(next))
}
if (typeof window !== 'undefined' && paper.value) {
  saved.value = readSaved().includes(paper.value.id)
}

const showVotes = computed(() => paper.value?.upvotes ?? 0)

const citations = computed<Record<string, string>>((): Record<string, string> => {
  const p = paper.value
  const c = contributor.value
  if (!p || !c) return {}
  return {
    APA: `${c.name}. (${p.year}). ${p.title}: ${p.subtitle}. Caleb's Library.`,
    MLA: `${c.name}. "${p.title}." ${p.subtitle}, Caleb's Library, ${p.year}.`,
    Chicago: `${c.name}. "${p.title}." ${p.subtitle}. Caleb's Library, ${p.year}.`,
    BibTeX: `@misc{${p.id},\n  author = {${c.name}},\n  title  = {${p.title}},\n  year   = {${p.year}},\n  note   = {${p.subtitle}},\n  url    = {calebslibrary.org/paper/${p.id}}\n}`,
  }
})

async function copyCitation(style: string) {
  const text = citations.value[style]
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = style
    setTimeout(() => (copied.value = null), 1600)
  } catch {
    // clipboard unavailable — ignore
  }
}

function download() {
  if (!paper.value) return
  window.open(paper.value.downloadUrl, '_blank', 'noopener')
  drive.recordMetric(paper.value.id, 'downloads')
}

function toggleVote(dir: 1 | -1) {
  if (!paper.value) return
  const next = voted.value === dir ? 0 : dir
  voted.value = next
  if (next === 1) drive.recordMetric(paper.value.id, 'upvotes')
}

async function share() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = 'share'
    setTimeout(() => (copied.value = null), 1600)
  } catch {
    // ignore
  }
}

const details = computed<[string, string][]>(() => {
  if (!paper.value) return []
  const p = paper.value
  return [
    ['Course', p.courseName],
    ['Professor', p.teacher || '—'],
    ['Language', 'English'],
    ['License', 'CC BY-NC 4.0'],
    ['Size', p.sizeLabel],
    ['Uploaded', timeAgo(p.createdAt)],
  ]
})

const comments = computed(() => {
  const c = drive.contributors[0]!
  const c2 = drive.contributors[1] ?? c
  const c3 = drive.contributors[2] ?? c
  return [
    { user: c, time: '2 days ago', body: 'This absolutely saved me for the midterm. The diagram on page 12 is worth the download alone.' },
    { user: c2, time: '1 week ago', body: 'Small correction — the enzyme name on page 8 should be RuBisCO (with a lowercase b). Otherwise, phenomenal work.', replies: 2 },
    { user: c3, time: '3 weeks ago', body: 'Requested access for our class group. Prof. Halloway referenced these notes explicitly last lecture.' },
  ]
})
</script>

<template>
  <div v-if="paper" class="screen-wrap paper">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <button class="crumb" @click="router.push({ name: 'browse' })">Library</button>
      <Icon name="chevron" :size="10" />
      <button
        v-if="subject"
        class="crumb"
        @click="router.push({ name: 'subject', params: { id: subject.id } })"
      >
        {{ subject.name }}
      </button>
      <Icon v-if="subject" name="chevron" :size="10" />
      <span class="crumb-current">{{ paper.type }}</span>
    </div>

    <!-- Header -->
    <div class="header">
      <BookCover :paper="paper" size="lg" />

      <div class="header-main">
        <div class="tags">
          <span v-if="subject" class="tag">{{ subject.name }}</span>
          <span class="tag tag-paper">{{ paper.type }}</span>
          <span class="tag tag-paper">{{ paper.year }}</span>
        </div>
        <h1 class="title">{{ paper.title }}</h1>
        <div class="subtitle">{{ paper.subtitle }}</div>
        <div class="meta-row">
          <button
            v-if="contributor"
            class="contrib"
            @click="router.push({ name: 'profile', params: { id: contributor.id } })"
          >
            <Avatar :user="contributor" :size="32" />
            <div class="contrib-text">
              <div class="contrib-name">{{ contributor.name }}</div>
              <div class="mono-meta">{{ contributor.uploads }} contributions</div>
            </div>
          </button>
          <div class="divider" />
          <div class="meta-item">
            <Icon name="file" :size="14" /> {{ paper.pages }} pages · {{ paper.fileExt.toUpperCase() || 'PDF' }}
          </div>
          <div class="meta-item">
            <Icon name="eye" :size="14" /> {{ paper.views.toLocaleString() }}
          </div>
          <div class="meta-item">
            <Icon name="clock" :size="14" /> Uploaded {{ timeAgo(paper.createdAt) }}
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn btn-primary action-download" @click="download">
          <Icon name="download" :size="16" /> Download PDF
        </button>
        <div class="action-pair">
          <button class="btn btn-secondary" :class="{ 'is-saved': saved }" @click="toggleSaved">
            <Icon name="bookmark" :size="15" :stroke-width="1.5" /> {{ saved ? 'Saved' : 'Save' }}
          </button>
          <button class="btn btn-secondary" @click="share">
            <Icon name="share" :size="15" /> {{ copied === 'share' ? 'Copied' : 'Share' }}
          </button>
        </div>
        <div class="vote-group">
          <button class="vote-up" :class="{ active: voted === 1 }" @click="toggleVote(1)">
            <Icon name="arrow-up" :size="14" /> {{ showVotes }}
          </button>
          <div class="vote-divider" />
          <button class="vote-down" :class="{ active: voted === -1 }" @click="toggleVote(-1)">
            <Icon name="arrow-down" :size="14" />
          </button>
        </div>
        <button class="btn-ghost report">
          <Icon name="flag" :size="12" /> Report an issue
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="body">
      <div class="main-col">
        <!-- Tabs -->
        <div class="tabs">
          <button
            v-for="t in tabs"
            :key="t.id"
            class="tab"
            :class="{ active: tab === t.id }"
            @click="tab = t.id"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- Preview -->
        <div v-if="tab === 'preview'" class="preview-tab">
          <div class="preview-frame">
            <PDFPreview :paper="paper" :height="720" />
            <div class="page-nav">
              <span class="pn-btn" style="opacity: 0.5"><Icon name="arrow-left" :size="14" /></span>
              <span>Page 1 of {{ paper.pages }}</span>
              <span class="pn-btn"><Icon name="arrow-right" :size="14" /></span>
            </div>
          </div>
          <div class="preview-hint">Scroll to preview more pages · Download for the full document</div>
        </div>

        <!-- Citation -->
        <div v-else-if="tab === 'citation'" class="citation-tab">
          <div v-for="(text, style) in citations" :key="style" class="cite-card">
            <div class="cite-head">
              <span class="smallcaps">{{ style }}</span>
              <button class="btn-ghost cite-copy" @click="copyCitation(style)">
                {{ copied === style ? 'Copied ✓' : 'Copy' }}
              </button>
            </div>
            <pre v-if="style === 'BibTeX'" class="cite-text mono">{{ text }}</pre>
            <div v-else class="cite-text">{{ text }}</div>
          </div>
        </div>

        <!-- Comments -->
        <div v-else class="comments-tab">
          <div class="composer">
            <Avatar :user="contributor" :size="32" />
            <div class="composer-main">
              <textarea
                v-model="commentBody"
                placeholder="Add to the discussion. Anyone can comment; a name is nice but not required."
                class="composer-input"
              />
              <div class="composer-foot">
                <input v-model="commentName" class="composer-name" placeholder="Your name (optional)" />
                <button class="btn btn-primary composer-post" @click="commentBody = ''">Post</button>
              </div>
            </div>
          </div>

          <div v-for="c in comments" :key="c.user.id + c.time" class="comment">
            <Avatar :user="c.user" :size="32" />
            <div class="comment-main">
              <div class="comment-head">
                <span class="comment-name">{{ c.user.name }}</span>
                <span class="mono-meta">{{ c.time }}</span>
              </div>
              <div class="comment-body">{{ c.body }}</div>
              <div class="comment-actions">
                <button class="ca-btn"><Icon name="arrow-up" :size="11" /> 12</button>
                <button class="ca-btn">Reply</button>
                <span v-if="c.replies" class="ca-count">{{ c.replies }} replies</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="side-col">
        <div class="details-card">
          <div class="smallcaps" style="margin-bottom: 14px">Details</div>
          <div v-for="[k, v] in details" :key="k" class="detail-row">
            <span class="detail-key">{{ k }}</span>
            <span class="detail-value mono">{{ v }}</span>
          </div>
        </div>

        <div class="related-head smallcaps" style="margin-bottom: 14px">Related</div>
        <div class="related-list">
          <button
            v-for="p in related"
            :key="p.id"
            class="related-row"
            @click="router.push({ name: 'paper', params: { id: p.id } })"
          >
            <BookCover :paper="p" size="xs" />
            <div class="related-main">
              <div class="related-title">{{ p.title }}</div>
              <div class="mono-meta">{{ p.type }} · ▲{{ formatCount(p.upvotes) }}</div>
            </div>
          </button>
        </div>
      </aside>
    </div>
  </div>

  <div v-else class="screen-wrap missing">
    <div class="no-title">Paper not found.</div>
    <button class="btn btn-secondary" @click="router.push({ name: 'browse' })">Browse the library</button>
  </div>
</template>

<style scoped>
.paper {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 40px 32px;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-40);
  margin-bottom: 24px;
}
.crumb {
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  color: var(--ink-40);
  cursor: pointer;
}
.crumb:hover {
  color: var(--ink-100);
  text-decoration: underline;
}
.crumb-current {
  color: var(--ink-100);
}

.header {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 40px;
  margin-bottom: 40px;
}
.tags {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.title {
  font-size: clamp(30px, 4.5vw, 44px);
  line-height: 1.05;
  margin: 0;
  letter-spacing: -0.03em;
  color: var(--ink-100);
  font-weight: 500;
  text-wrap: balance;
}
.subtitle {
  font-size: 17px;
  color: var(--ink-70);
  margin-top: 8px;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.contrib {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
}
.contrib-name {
  font-size: 13px;
  color: var(--ink-100);
  font-weight: 500;
}
.divider {
  width: 1px;
  height: 24px;
  background: var(--rule);
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-70);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
}
.action-download {
  padding: 12px 20px;
  justify-content: center;
}
.action-pair {
  display: flex;
  gap: 6px;
}
.action-pair .btn {
  flex: 1;
  justify-content: center;
  padding: 10px;
}
.btn.is-saved {
  border-color: var(--ink-100);
  background: var(--paper-2);
}
.vote-group {
  display: flex;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--rule-strong);
  border-radius: 4px;
  padding: 4px;
  margin-top: 4px;
}
.vote-up {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-70);
  background: transparent;
  cursor: pointer;
}
.vote-up.active {
  background: var(--ink-100);
  color: var(--paper);
}
.vote-down {
  padding: 8px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: var(--ink-70);
  background: transparent;
  cursor: pointer;
}
.vote-down.active {
  background: var(--ink-100);
  color: var(--paper);
}
.vote-divider {
  width: 1px;
  height: 20px;
  background: var(--rule);
}
.report {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px;
  justify-content: center;
}

.body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 24px;
}
.tab {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-40);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--dur-fast);
}
.tab:hover {
  color: var(--ink-100);
}
.tab.active {
  color: var(--ink-100);
  border-bottom-color: var(--ink-100);
}

/* Preview */
.preview-frame {
  background: var(--paper-2);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 32px;
  position: relative;
}
.page-nav {
  position: absolute;
  bottom: 32px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  background: var(--overlay);
  backdrop-filter: blur(6px);
  color: var(--paper);
  border-radius: 999px;
  padding: 8px 14px;
  margin: 0 auto;
  width: fit-content;
  font-family: var(--font-mono);
  font-size: 12px;
  align-items: center;
}
.pn-btn {
  display: flex;
  color: var(--paper);
}
.preview-hint {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: var(--ink-40);
}

/* Citation */
.citation-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cite-card {
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 20px;
  background: var(--bg-elevated);
}
.cite-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.cite-copy {
  font-size: 12px;
  padding: 4px 10px;
}
.cite-text {
  font-size: 14px;
  color: var(--ink-100);
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
  font-family: var(--font-sans);
}
.cite-text.mono {
  font-size: 12px;
}

/* Comments */
.composer {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: var(--bg-elevated);
}
.composer-main {
  flex: 1;
}
.composer-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--ink-100);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.55;
  resize: vertical;
  min-height: 60px;
}
.composer-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 12px;
}
.composer-name {
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 12px;
  color: var(--ink-70);
  padding: 4px;
  flex: 1;
}
.composer-post {
  font-size: 13px;
  padding: 6px 14px;
}
.comment {
  display: flex;
  gap: 12px;
  padding: 16px 4px;
  border-bottom: 1px solid var(--rule);
}
.comment-main {
  flex: 1;
}
.comment-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.comment-name {
  font-size: 13px;
  color: var(--ink-100);
  font-weight: 500;
}
.comment-body {
  color: var(--ink-70);
  font-size: 14px;
  line-height: 1.55;
}
.comment-actions {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--ink-40);
}
.ca-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-40);
  background: none;
  border: none;
  cursor: pointer;
}
.ca-btn:hover {
  color: var(--ink-100);
}

/* Sidebar */
.details-card {
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 24px;
  background: var(--bg-elevated);
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--rule);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-key {
  color: var(--ink-40);
}
.detail-value {
  color: var(--ink-100);
  font-size: 12px;
  text-align: right;
}
.related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.related-row {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  background: none;
  border: none;
  text-align: left;
  transition: background var(--dur-fast);
}
.related-row:hover {
  background: var(--paper-2);
}
.related-main {
  flex: 1;
  min-width: 0;
}
.related-title {
  font-size: 13px;
  color: var(--ink-100);
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.005em;
  margin-bottom: 4px;
}

.missing {
  padding: 96px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.no-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--ink-100);
}

@media (max-width: 1000px) {
  .header {
    grid-template-columns: 140px 1fr;
  }
  .actions {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    min-width: 0;
  }
  .body {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .paper {
    padding: 32px 20px;
  }
  .header {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }
  .header .book-cover {
    justify-self: center;
  }
  .actions {
    grid-column: auto;
    flex-direction: column;
  }
  .action-pair {
    width: 100%;
  }
  .action-pair .btn {
    flex: 1;
  }
  .meta-row {
    gap: 12px;
  }
  .divider {
    display: none;
  }
  .tabs {
    overflow-x: auto;
    scrollbar-width: none;
    margin-left: -20px;
    margin-right: -20px;
    padding: 0 20px;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }
  .preview-frame {
    padding: 16px;
  }
  .page-nav {
    bottom: 16px;
    font-size: 11px;
    padding: 6px 12px;
    gap: 8px;
  }
  .composer {
    flex-direction: column;
    gap: 0;
  }
  .composer-foot {
    flex-wrap: wrap;
  }
  .composer-post {
    margin-left: auto;
  }
  .cite-card {
    padding: 16px;
  }
  .cite-head {
    flex-wrap: wrap;
    gap: 8px;
  }
  .missing {
    padding: 64px 20px;
  }
}
</style>
