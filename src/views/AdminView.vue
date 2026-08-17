<script setup lang="ts">
// Admin — passphrase-gated moderation queue. Ported from Admin.jsx.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { adminOk, getSubmissions, reviewSubmission } from '@/script/supabase'
import type { Submission } from '@/script/supabase'
import Icon from '@/components/Icon.vue'
import BookCover from '@/components/BookCover.vue'
import Avatar from '@/components/Avatar.vue'
import PDFPreview from '@/components/PDFPreview.vue'

const drive = useDriveStore()
const router = useRouter()

const unlocked = ref(
  typeof window !== 'undefined' && localStorage.getItem('calebs_admin') === '1',
)
const passphrase = ref(
  typeof window !== 'undefined' ? sessionStorage.getItem('calebs_pass') || '' : '',
)
const wrongTry = ref(false)
const busy = ref(false)
const queueErr = ref('')
const selected = ref(0)
type QueueFilter = 'pending' | 'approved' | 'rejected'
const filter = ref<QueueFilter>('pending')

const submissions = ref<Submission[]>([])
const reviewNote = ref('')
const driveFileId = ref('')

onMounted(() => {
  if (unlocked.value) loadQueue()
})

async function unlock() {
  if (!passphrase.value.trim()) {
    wrongTry.value = true
    return
  }
  wrongTry.value = false
  busy.value = true
  queueErr.value = ''
  try {
    const ok = await adminOk(passphrase.value)
    if (ok) {
      localStorage.setItem('calebs_admin', '1')
      sessionStorage.setItem('calebs_pass', passphrase.value)
      unlocked.value = true
      await loadQueue()
    } else {
      wrongTry.value = true
    }
  } catch (e) {
    queueErr.value = e instanceof Error ? e.message : 'Could not reach the server.'
  } finally {
    busy.value = false
  }
}

async function loadQueue() {
  busy.value = true
  queueErr.value = ''
  try {
    submissions.value = await getSubmissions(passphrase.value)
    selected.value = 0
  } catch (e) {
    queueErr.value = e instanceof Error ? e.message : 'Could not load the queue.'
  } finally {
    busy.value = false
  }
}

function signOut() {
  localStorage.removeItem('calebs_admin')
  sessionStorage.removeItem('calebs_pass')
  unlocked.value = false
  submissions.value = []
}

const counts = computed(() => {
  const c = { pending: 0, approved: 0, rejected: 0 }
  for (const s of submissions.value) c[s.status] += 1
  return c
})

const FILTERS: { id: QueueFilter; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const filteredQueue = computed(() =>
  submissions.value.filter((s) => s.status === filter.value),
)

const current = computed<Submission | undefined>(() => filteredQueue.value[selected.value])

const currentPaper = computed(() => (current.value ? drive.paperFromSubmission(current.value) : undefined))

const subCounts = computed(() => {
  const m = new Map<string, number>()
  for (const s of submissions.value) {
    m.set(s.contributor_email, (m.get(s.contributor_email) || 0) + 1)
  }
  return m
})

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.round(ms / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString()
}

async function decide(status: 'approved' | 'rejected') {
  if (!current.value || busy.value) return
  busy.value = true
  queueErr.value = ''
  try {
    await reviewSubmission(
      current.value.id,
      status,
      passphrase.value,
      reviewNote.value.trim() || undefined,
      status === 'approved' && driveFileId.value.trim() ? driveFileId.value.trim() : undefined,
    )
    reviewNote.value = ''
    driveFileId.value = ''
    await loadQueue()
  } catch (e) {
    queueErr.value = e instanceof Error ? e.message : 'Could not save the decision.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="screen-wrap">
    <!-- Passphrase gate -->
    <div v-if="!unlocked" class="gate">
      <div class="gate-card">
        <div class="gate-icon"><Icon name="shield" :size="20" /></div>
        <div class="smallcaps" style="margin-bottom: 8px">Moderators only</div>
        <h1 class="gate-title">Enter passphrase</h1>
        <p class="gate-sub">
          The moderation queue is behind a shared passphrase. Ask an existing moderator for the
          current one — it rotates each semester.
        </p>
        <form @submit.prevent="unlock">
          <input
            v-model="passphrase"
            class="input gate-input"
            type="password"
            placeholder="passphrase"
            autofocus
            @input="wrongTry = false"
          />
          <div v-if="wrongTry" class="gate-error">That's not the passphrase.</div>
          <div v-if="queueErr" class="gate-error">{{ queueErr }}</div>
          <button type="submit" class="btn btn-primary gate-btn" :disabled="busy">
            {{ busy ? 'Checking…' : 'Unlock' }}
            <Icon v-if="!busy" name="arrow-right" :size="14" />
          </button>
        </form>
        <div class="gate-foot">
          Not a moderator?
          <button class="gate-link" @click="router.push({ name: 'about' })">
            Read about how moderation works.
          </button>
        </div>
      </div>
    </div>

    <!-- Queue -->
    <div v-else>
      <div class="queue-head">
        <div class="wrap queue-head-inner">
          <div>
            <div class="smallcaps" style="margin-bottom: 6px">Moderators · You're signed in</div>
            <h1 class="queue-title">Moderation queue</h1>
          </div>
          <div class="queue-actions">
            <button
              v-for="f in FILTERS"
              :key="f.id"
              class="filter-chip"
              :class="{ active: filter === f.id }"
              @click="filter = f.id"
            >
              {{ f.label }}
              <span class="filter-count">{{ counts[f.id] }}</span>
            </button>
            <button class="btn-ghost signout" @click="signOut">Sign out</button>
            <button class="btn-ghost signout" :disabled="busy" @click="loadQueue">
              <Icon v-if="busy" name="refresh" :size="13" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div class="queue-body">
        <!-- Rail -->
        <div class="rail">
          <button
            v-for="(s, i) in filteredQueue"
            :key="s.id"
            class="rail-row"
            :class="{ active: selected === i }"
            @click="selected = i"
          >
            <div class="rail-badges">
              <span class="mono rail-id">#{{ String(s.id).padStart(4, '0') }}</span>
              <span v-if="s.status === 'rejected'" class="badge badge-rej">REJECTED</span>
            </div>
            <div class="rail-title">{{ s.title }}</div>
            <div class="rail-meta">
              <Avatar :name="s.contributor_name" :size="16" />
              <span class="rail-name">{{ s.contributor_name }}</span>
              <span class="rail-time mono-meta">{{ timeAgo(s.created_at) }}</span>
            </div>
          </button>
          <div v-if="!filteredQueue.length" class="rail-empty">No items in this view.</div>
        </div>

        <!-- Review panel -->
        <div class="panel">
          <div v-if="current && currentPaper">
            <div class="panel-header">
              <BookCover :paper="currentPaper" size="md" />
              <div class="panel-main">
                <div class="tags">
                  <span class="tag">{{ currentPaper.subjectName }}</span>
                  <span class="tag tag-paper">{{ currentPaper.type }}</span>
                </div>
                <div class="panel-title">{{ current.title }}</div>
                <div class="panel-sub">{{ current.subject_name }}<template v-if="current.course_name"> · {{ current.course_name }}</template></div>
                <div class="panel-meta">
                  <Avatar :name="current.contributor_name" :size="22" />
                  <span>{{ current.contributor_name }}</span>
                  <span>·</span>
                  <span class="mono">{{ subCounts.get(current.contributor_email) || 1 }} upload{{ (subCounts.get(current.contributor_email) || 1) > 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>

            <div class="checks-label smallcaps" style="margin-bottom: 14px">Submission</div>
            <div class="checks">
              <div class="check-tile">
                <div class="smallcaps" style="font-size: 9px; margin-bottom: 6px">File</div>
                <div class="check-value" style="font-size: 12px">{{ current.file_name }}</div>
              </div>
              <div class="check-tile">
                <div class="smallcaps" style="font-size: 9px; margin-bottom: 6px">Size</div>
                <div class="check-value">{{ (Number(current.file_size) / 1_000_000).toFixed(2) }} MB</div>
              </div>
              <div class="check-tile">
                <div class="smallcaps" style="font-size: 9px; margin-bottom: 6px">Type</div>
                <div class="check-value">{{ current.mime_type }}</div>
              </div>
              <div class="check-tile">
                <div class="smallcaps" style="font-size: 9px; margin-bottom: 6px">Status</div>
                <div class="check-value">{{ current.status }}</div>
              </div>
            </div>

            <div v-if="current.description" class="checks-label smallcaps" style="margin-bottom: 14px">Description</div>
            <div v-if="current.description" class="desc-block">{{ current.description }}</div>

            <div class="checks-label smallcaps" style="margin-bottom: 14px">Document preview</div>
            <div class="doc-preview">
              <PDFPreview :paper="currentPaper" :height="420" />
            </div>

            <div v-if="queueErr" class="queue-error">
              <Icon name="info" :size="14" />
              <span>{{ queueErr }}</span>
            </div>

            <div class="decision">
              <div class="smallcaps" style="margin-bottom: 14px">Decision</div>
              <div class="drive-id-field">
                <label class="drive-id-label">
                  <Icon name="google" :size="14" />
                  <span>Google Drive file ID <span class="drive-id-optional">(optional — for Drive-hosted papers)</span></span>
                </label>
                <input
                  v-model="driveFileId"
                  class="input drive-id-input"
                  placeholder="e.g. 1AbCdEfGhIjKlMnOpQrStUvWxYz"
                />
              </div>
              <textarea
                v-model="reviewNote"
                placeholder="Add a note to the contributor (optional)…"
                class="decision-input"
              />
              <div class="decision-actions">
                <button class="btn btn-secondary" style="padding: 10px 18px" :disabled="busy" @click="decide('rejected')">
                  <Icon name="x" :size="14" /> Reject
                </button>
                <button class="btn btn-primary" style="padding: 10px 18px" :disabled="busy" @click="decide('approved')">
                  <Icon name="check" :size="14" /> Approve & publish
                </button>
              </div>
            </div>
          </div>
          <div v-else class="panel-empty">Select an item from the queue.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Gate */
.gate {
  max-width: 440px;
  margin: 0 auto;
  padding: 96px 32px 0;
}
.gate-card {
  padding: 40px 32px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--bg-elevated);
}
.gate-icon {
  width: 44px;
  height: 44px;
  background: var(--ink-100);
  color: var(--paper);
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
}
.gate-title {
  font-size: 32px;
  margin: 0 0 8px;
  color: var(--ink-100);
  letter-spacing: -0.025em;
  font-weight: 500;
}
.gate-sub {
  color: var(--ink-70);
  font-size: 13.5px;
  line-height: 1.55;
  margin: 0 0 24px;
}
.gate-input {
  font-size: 15px;
  padding: 12px 14px;
  background: var(--paper);
}
.gate-error {
  margin-top: 10px;
  font-size: 12px;
  color: var(--ink-100);
}
.gate-btn {
  width: 100%;
  justify-content: center;
  margin-top: 16px;
  padding: 12px;
}
.gate-foot {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--rule);
  font-size: 12px;
  color: var(--ink-40);
}
.gate-link {
  color: var(--ink-100);
  cursor: pointer;
  text-decoration: underline;
  background: none;
  border: none;
  font-size: 12px;
  padding: 0;
}

/* Queue head */
.queue-head {
  background: var(--paper-2);
  border-bottom: 1px solid var(--rule);
  padding: 24px 0;
}
.wrap {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 32px;
}
.queue-head-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.queue-title {
  font-size: 32px;
  margin: 0;
  color: var(--ink-100);
  letter-spacing: -0.02em;
  font-weight: 500;
}
.queue-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.filter-chip {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
  background: transparent;
  color: var(--ink-70);
  border: 1px solid var(--rule-strong);
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.filter-chip.active {
  background: var(--ink-100);
  color: var(--paper);
  border-color: var(--ink-100);
}
.filter-count {
  padding: 1px 6px;
  font-size: 10px;
  font-family: var(--font-mono);
  border-radius: 2px;
  background: var(--paper-2);
  color: var(--ink-70);
}
.filter-chip.active .filter-count {
  background: rgba(255, 255, 255, 0.15);
  color: var(--paper);
}
.signout {
  font-size: 12px;
}

/* Queue body */
.queue-body {
  display: grid;
  grid-template-columns: 360px 1fr;
  max-width: var(--max-content);
  margin: 0 auto;
  border-left: 1px solid var(--rule);
  border-right: 1px solid var(--rule);
}

/* Rail */
.rail {
  border-right: 1px solid var(--rule);
  background: var(--bg-elevated);
}
.rail-row {
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-bottom: 1px solid var(--rule);
  border-left: 3px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  display: block;
}
.rail-row:hover {
  background: var(--paper-2);
}
.rail-row.active {
  background: var(--paper-2);
  border-left-color: var(--ink-100);
}
.rail-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.rail-id {
  color: var(--ink-40);
  font-size: 10px;
}
.badge {
  padding: 1px 6px;
  font-size: 9px;
  font-family: var(--font-mono);
  border-radius: 2px;
}
.badge-flag {
  background: var(--ink-100);
  color: var(--paper);
}
.badge-ai {
  background: var(--paper-3);
  color: var(--ink-100);
}
.badge-rej {
  background: transparent;
  color: var(--error);
  border: 1px solid var(--error);
}
.rail-title {
  font-size: 15px;
  color: var(--ink-100);
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.005em;
}
.rail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.rail-name {
  font-size: 11px;
  color: var(--ink-70);
}
.rail-time {
  margin-left: auto;
}
.rail-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--ink-40);
  font-size: 13px;
}

/* Panel */
.panel {
  padding: 32px;
}
.alert-bar {
  padding: 14px 18px;
  background: var(--ink-100);
  color: var(--paper);
  border-radius: 4px;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
.alert-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.alert-note {
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.85;
}
.panel-header {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 24px;
  margin-bottom: 32px;
}
.tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.panel-title {
  font-size: 28px;
  color: var(--ink-100);
  line-height: 1.1;
  margin-bottom: 8px;
  font-weight: 500;
  letter-spacing: -0.025em;
}
.panel-sub {
  color: var(--ink-70);
  margin-bottom: 16px;
}
.panel-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--ink-70);
}
.checks {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}
.check-tile {
  padding: 14px;
  border: 1px solid var(--rule);
  border-radius: 4px;
  background: var(--bg-elevated);
}
.check-tile.fail {
  border-color: var(--ink-100);
  background: var(--paper-2);
}
.check-value {
  font-size: 15px;
  font-family: var(--font-mono);
  color: var(--ink-100);
  font-weight: 500;
}
.doc-preview {
  max-width: 500px;
  margin-bottom: 32px;
}
.desc-block {
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink-70);
  margin-bottom: 32px;
}
.queue-error {
  margin: 0 0 24px;
  padding: 12px 14px;
  border: 1px solid var(--rule);
  border-left: 3px solid var(--error);
  background: var(--paper-2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ink-100);
}
.btn[disabled] {
  opacity: 0.5;
  pointer-events: none;
}
.decision {
  padding: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: 6px;
}
.decision-input {
  width: 100%;
  background: var(--paper);
  border: 1px solid var(--rule-strong);
  color: var(--ink-100);
  padding: 12px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  min-height: 60px;
  outline: none;
}
.decision-input:focus {
  border-color: var(--ink-100);
}
.drive-id-field {
  margin-bottom: 14px;
}
.drive-id-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-70);
  margin-bottom: 6px;
}
.drive-id-optional {
  font-weight: 400;
  color: var(--ink-40);
}
.drive-id-input {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
}
.decision-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: flex-end;
}
.panel-empty {
  padding: 80px;
  text-align: center;
  color: var(--ink-40);
}

@media (max-width: 900px) {
  .queue-body {
    grid-template-columns: 1fr;
  }
  .rail {
    border-right: none;
    border-bottom: 1px solid var(--rule);
  }
}
@media (max-width: 640px) {
  .gate {
    padding: 64px 20px 0;
  }
  .gate-card {
    padding: 32px 24px;
  }
  .gate-title {
    font-size: 28px;
  }
  .wrap {
    padding: 0 20px;
  }
  .queue-head-inner {
    gap: 16px;
  }
  .queue-actions {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }
  .queue-actions::-webkit-scrollbar {
    display: none;
  }
  .filter-chip {
    white-space: nowrap;
    flex-shrink: 0;
  }
  .panel {
    padding: 20px;
  }
  .panel-header {
    grid-template-columns: 100px 1fr;
    gap: 16px;
  }
  .panel-title {
    font-size: 22px;
  }
  .panel-meta {
    flex-wrap: wrap;
    row-gap: 4px;
  }
  .checks {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .check-tile {
    padding: 12px;
  }
  .decision-actions {
    flex-wrap: wrap;
  }
  .decision-actions .btn {
    flex: 1 1 100%;
    justify-content: center;
  }
  .panel-empty {
    padding: 48px 20px;
  }
}
</style>
