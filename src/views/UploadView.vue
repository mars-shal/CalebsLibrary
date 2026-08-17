<script setup lang="ts">
// Upload — 3-step contribution flow, no account. Ported from Upload.jsx.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriveStore } from '@/stores/drive'
import { supabase, UPLOADS_BUCKET, insertSubmission } from '@/script/supabase'
import Icon from '@/components/Icon.vue'

const drive = useDriveStore()
const router = useRouter()

const step = ref(1)
const file = ref<File | null>(null)
const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const confirmed = ref(false)
const uploading = ref(false)
const submitted = ref(false)
const errorMsg = ref('')

const DEFAULT_FORM = {
  contributorName: '',
  contributorEmail: '',
  title: '',
  subject: '',
  type: 'Study Guide',
  course: '',
  professor: '',
  year: new Date().getFullYear(),
  description: '',
  license: 'cc-by-nc',
}
const form = ref({ ...DEFAULT_FORM })

const TYPES = ['Study Guide', 'Lecture Notes', 'Past Exam', 'Problem Set', 'Essay', 'Cheat Sheet', 'Slides', 'Project']
const LICENSES = [
  { id: 'cc-by-nc', title: 'CC BY-NC 4.0 — Attribution, non-commercial', rec: true },
  { id: 'cc-by', title: 'CC BY 4.0 — Attribution required', rec: false },
  { id: 'public', title: 'Public Domain (CC0)', rec: false },
]

const canContinue = computed(() => !!file.value)
const canReview = computed(
  () => form.value.contributorName.trim().length > 0 && form.value.contributorEmail.trim().length > 0 && form.value.title.trim().length > 0 && form.value.subject !== '',
)
const canSubmit = computed(() => canReview.value && confirmed.value && !uploading.value)

const subjectName = computed(() =>
  form.value.subject ? drive.getSubject(form.value.subject)?.name ?? '—' : '—',
)

const courseName = computed(() => {
  const code = form.value.course.trim().toUpperCase()
  if (!code) return ''
  const s = drive.subjects.find((x) => x.code === code)
  return s ? s.name : code
})

function pickFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) file.value = f
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) file.value = f
}

const fileSize = computed(() =>
  file.value ? (file.value.size / 1_000_000).toFixed(2) : '0',
)
const filePages = computed(() => (file.value ? Math.max(2, Math.round(file.value.size / 40000)) : 24))

function reset() {
  submitted.value = false
  step.value = 1
  file.value = null
  confirmed.value = false
  errorMsg.value = ''
  form.value = { ...DEFAULT_FORM }
}

async function submit() {
  if (!file.value || !canSubmit.value) return
  uploading.value = true
  errorMsg.value = ''
  try {
    const f = file.value
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
    const path = `${crypto.randomUUID()}-${safe}`
    const { error: upErr } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .upload(path, f, {
        cacheControl: '3600',
        contentType: f.type || 'application/octet-stream',
        upsert: false,
      })
    if (upErr) throw upErr

    await insertSubmission({
      title: form.value.title.trim(),
      subject: form.value.subject,
      subject_name: subjectName.value === '—' ? '' : subjectName.value,
      type: form.value.type,
      course: form.value.course.trim(),
      course_name: courseName.value,
      description: form.value.description.trim(),
      contributor_name: form.value.contributorName.trim(),
      contributor_email: form.value.contributorEmail.trim(),
      license: form.value.license,
      file_name: f.name,
      file_size: f.size,
      mime_type: f.type || 'application/octet-stream',
      storage_path: path,
    })
    submitted.value = true
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="screen-wrap upload">
    <div class="header">
      <div class="smallcaps" style="margin-bottom: 12px">Contribute</div>
      <h1 class="title">Add to the library.</h1>
      <p class="sub">
        Your notes carried you through the semester. Pass them along.
        <strong style="color: var(--ink-100)">No account required</strong> — just tell us who you are so
        we can credit you, and a moderator will review before it goes live.
      </p>
    </div>

    <!-- Stepper -->
    <div class="stepper">
      <div v-for="(s, i) in [{ n: 1, t: 'Upload file' }, { n: 2, t: 'Your details' }, { n: 3, t: 'Review & submit' }]" :key="s.n" class="step">
        <div class="step-node">
          <div class="step-circle" :class="{ done: step > s.n, current: step >= s.n }">
            <Icon v-if="step > s.n" name="check" :size="12" />
            <template v-else>{{ s.n }}</template>
          </div>
          <div class="step-text">
            <div class="smallcaps" style="font-size: 9px">Step {{ s.n }}</div>
            <div class="step-title" :class="{ active: step >= s.n }">{{ s.t }}</div>
          </div>
        </div>
        <div v-if="i < 2" class="step-line" :class="{ filled: step > s.n }" />
      </div>
    </div>

    <!-- Success -->
    <div v-if="submitted" class="success-card">
      <div class="success-icon"><Icon name="check" :size="26" /></div>
      <div class="success-title">Submitted for review.</div>
      <div class="success-sub">
        <strong>{{ form.title || 'Your paper' }}</strong> is in the queue — a moderator will review it
        within 24–48 hours. Once approved it appears in the library under
        <span style="color: var(--ink-100)">{{ subjectName }}</span>, credited to
        {{ form.contributorName || 'you' }}.
      </div>
      <div class="step-nav" style="justify-content: flex-start">
        <button class="btn btn-primary" @click="reset">
          Upload another file <Icon name="upload" :size="14" />
        </button>
        <button class="btn btn-secondary" @click="router.push({ name: 'home' })">Browse the library</button>
      </div>
    </div>

    <!-- Step 1 — dropzone -->
    <div v-else-if="step === 1">
      <div
        class="dropzone"
        :class="{ dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop="onDrop"
        @click="fileInput?.click()"
      >
        <div class="dz-icon">
          <Icon name="upload" :size="22" />
        </div>
        <div class="dz-title">{{ file ? 'One file, ready to catalog.' : 'Drop a file to begin.' }}</div>
        <div class="dz-sub">
          {{ file ? 'Continue below to add details, or drop another file.' : 'PDF, DOCX, PPTX, or images. Up to 25 MB per file.' }}
        </div>
        <button v-if="!file" class="btn btn-primary" style="padding: 12px 24px" @click.stop="fileInput?.click()">
          Choose a file
        </button>
        <input ref="fileInput" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" style="display: none" @change="pickFile" />
      </div>

      <div v-if="file" class="file-chip">
        <div class="file-badge">{{ file.name.split('.').pop()?.toUpperCase() || 'PDF' }}</div>
        <div class="file-main">
          <div class="file-name">{{ file.name }}</div>
          <div class="mono-meta">{{ fileSize }} MB · Uploaded</div>
        </div>
        <div class="file-ok"><Icon name="check" :size="12" /></div>
        <button class="btn-ghost file-x" @click="file = null"><Icon name="x" :size="15" /></button>
      </div>

      <div class="step-nav">
        <button class="btn btn-secondary" @click="router.push({ name: 'home' })">Cancel</button>
        <button class="btn btn-primary" :class="{ disabled: !canContinue }" @click="step = 2">
          Continue <Icon name="arrow-right" :size="14" />
        </button>
      </div>
    </div>

    <!-- Step 2 — details -->
    <div v-else-if="step === 2">
      <div class="contrib-card">
        <div class="smallcaps" style="color: var(--ink-100); margin-bottom: 6px">Who's contributing?</div>
        <div class="cc-title">Since there's no account, we ask each time.</div>
        <div class="cc-sub">
          Your name will appear as the contributor. Your email is used only to reach you if a
          moderator has a question — it stays private.
        </div>
        <div class="grid-2">
          <div class="field">
            <label class="field-label">Your name <span class="req">*</span></label>
            <input v-model="form.contributorName" class="input" placeholder="First name, or a handle" />
          </div>
          <div class="field">
            <label class="field-label">Email <span class="req">*</span><span class="hint">Never shown publicly</span></label>
            <input v-model="form.contributorEmail" class="input" type="email" placeholder="you@example.com" />
          </div>
        </div>
      </div>

      <div class="fields">
        <div class="field">
          <label class="field-label">Title <span class="req">*</span></label>
          <input v-model="form.title" class="input" placeholder="e.g. Photosynthesis in C4 Plants" />
        </div>

        <div class="grid-2">
          <div class="field">
            <label class="field-label">Subject <span class="req">*</span></label>
            <select v-model="form.subject" class="input">
              <option value="">Choose a subject…</option>
              <option v-for="s in drive.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Type <span class="req">*</span></label>
            <select v-model="form.type" class="input">
              <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <div class="grid-3">
          <div class="field">
            <label class="field-label">Course code</label>
            <input v-model="form.course" class="input" placeholder="e.g. BIO 302" />
          </div>
          <div class="field">
            <label class="field-label">Professor</label>
            <input v-model="form.professor" class="input" placeholder="e.g. Prof. Halloway" />
          </div>
          <div class="field">
            <label class="field-label">Year</label>
            <input v-model.number="form.year" class="input" type="number" />
          </div>
        </div>

        <div class="field">
          <label class="field-label">Description <span class="hint">One paragraph. What's in here, and who does it help?</span></label>
          <textarea v-model="form.description" class="input" rows="4" style="resize: vertical; font-family: inherit; line-height: 1.55" placeholder="A quick note about what these cover…" />
        </div>

        <div class="field">
          <label class="field-label">License</label>
          <div class="license-list">
            <label v-for="l in LICENSES" :key="l.id" class="license-row" :class="{ rec: l.rec }">
              <input v-model="form.license" type="radio" name="license" :value="l.id" />
              <span class="license-title">{{ l.title }}</span>
              <span v-if="l.rec" class="tag" style="font-size: 9px">RECOMMENDED</span>
            </label>
          </div>
        </div>
      </div>

      <div class="step-nav">
        <button class="btn btn-secondary" @click="step = 1">
          <Icon name="arrow-left" :size="14" /> Back
        </button>
        <button class="btn btn-primary" :class="{ disabled: !canReview }" @click="step = 3">
          Review <Icon name="arrow-right" :size="14" />
        </button>
      </div>
    </div>

    <!-- Step 3 — review -->
    <div v-else>
      <div class="review-card">
        <div class="preview-cover">
          <div class="pc-subject">{{ subjectName }}</div>
          <div class="pc-title">{{ form.title || 'Your paper title' }}</div>
          <div class="pc-spacer" />
          <div class="pc-meta">{{ form.year }} · {{ filePages }}pp</div>
        </div>
        <div class="review-main">
          <div class="smallcaps" style="margin-bottom: 6px">Preview</div>
          <div class="review-title">{{ form.title || 'Untitled paper' }}</div>
          <div class="review-line">
            {{ form.course ? `${form.course} · ` : '' }}{{ form.professor || '—' }}
          </div>
          <div class="review-grid">
            <div>
              <div class="mono-meta" style="font-size: 10px">Contributor</div>
              <div class="review-val">{{ form.contributorName || '—' }}</div>
            </div>
            <div>
              <div class="mono-meta" style="font-size: 10px">Subject</div>
              <div class="review-val">{{ subjectName }}</div>
            </div>
            <div>
              <div class="mono-meta" style="font-size: 10px">Type</div>
              <div class="review-val">{{ form.type }}</div>
            </div>
            <div>
              <div class="mono-meta" style="font-size: 10px">Year</div>
              <div class="review-val">{{ form.year }}</div>
            </div>
          </div>
          <div class="info-callout">
            <Icon name="info" :size="15" class="info-icon" />
            <div>
              A moderator will review within 24–48 hours. If they need to reach you, they'll email
              <span style="color: var(--ink-100)">{{ form.contributorEmail || 'your address' }}</span>.
              Your name will appear as the contributor once it's live.
            </div>
          </div>
        </div>
      </div>

      <label class="confirm">
        <input v-model="confirmed" type="checkbox" class="confirm-check" />
        <span class="confirm-text">
          I confirm this is my own work (or I have permission to share it), and I understand it will
          be publicly readable once approved.
        </span>
      </label>

      <div v-if="errorMsg" class="upload-error">
        <Icon name="info" :size="14" />
        <span>{{ errorMsg }}</span>
      </div>

      <div class="step-nav">
        <button class="btn btn-secondary" @click="step = 2">
          <Icon name="arrow-left" :size="14" /> Back
        </button>
        <button class="btn btn-primary" :class="{ disabled: !canSubmit }" @click="submit">
          {{ uploading ? 'Uploading…' : 'Submit for review' }}
          <Icon v-if="!uploading" name="check" :size="14" />
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

/* Stepper */
.stepper {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  padding: 20px 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: 6px;
}
.step {
  display: flex;
  align-items: center;
  flex: 1;
}
.step:last-child {
  flex: 0;
}
.step-node {
  display: flex;
  align-items: center;
  gap: 12px;
}
.step-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: transparent;
  border: 1.5px solid var(--ink-30);
  color: var(--ink-40);
  font-size: 13px;
  font-weight: 600;
  transition: all var(--dur-med);
}
.step-circle.current {
  background: var(--ink-100);
  border-color: var(--ink-100);
  color: var(--paper);
}
.step-circle.done {
  background: var(--ink-100);
  border-color: var(--ink-100);
  color: var(--paper);
}
.step-text {
  white-space: nowrap;
}
.step-title {
  font-size: 13.5px;
  color: var(--ink-40);
  font-weight: 500;
}
.step-title.active {
  color: var(--ink-100);
}
.step-line {
  flex: 1;
  height: 1px;
  background: var(--rule);
  margin: 0 20px;
  transition: background var(--dur-med);
}
.step-line.filled {
  background: var(--ink-100);
}

/* Dropzone */
.dropzone {
  border: 2px dashed var(--rule-strong);
  border-radius: 8px;
  padding: 72px 32px;
  text-align: center;
  background: var(--bg-elevated);
  transition: all var(--dur-fast);
  cursor: pointer;
}
.dropzone.dragging {
  border-color: var(--ink-100);
  background: var(--paper-2);
}
.dz-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  display: grid;
  place-items: center;
  background: var(--paper-2);
  border-radius: 50%;
  color: var(--ink-100);
}
.dz-title {
  font-size: 26px;
  color: var(--ink-100);
  font-weight: 500;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.dz-sub {
  color: var(--ink-70);
  margin-bottom: 20px;
  font-size: 14px;
}

/* File chip */
.file-chip {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-elevated);
}
.file-badge {
  width: 44px;
  height: 56px;
  background: var(--ink-100);
  color: var(--paper);
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  border-radius: 2px;
}
.file-main {
  flex: 1;
  min-width: 0;
}
.file-name {
  color: var(--ink-100);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-ok {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--ink-100);
  color: var(--paper);
  display: grid;
  place-items: center;
}
.file-x {
  padding: 6px;
  color: var(--ink-40);
}

/* Step nav */
.step-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
}
.btn.disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Contributor card */
.contrib-card {
  padding: 24px;
  border: 1px solid var(--ink-100);
  border-radius: 6px;
  margin-bottom: 32px;
  background: var(--bg-elevated);
}
.cc-title {
  font-size: 15px;
  color: var(--ink-100);
  font-weight: 500;
  margin-bottom: 4px;
}
.cc-sub {
  font-size: 13px;
  color: var(--ink-70);
  margin-bottom: 20px;
  line-height: 1.55;
}

/* Fields */
.fields {
  display: grid;
  gap: 20px;
}
.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-100);
  margin-bottom: 8px;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.req {
  color: var(--ink-100);
}
.hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-40);
  font-weight: 400;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 120px;
  gap: 16px;
}

/* License */
.license-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.license-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}
.license-row.rec {
  border-color: var(--ink-100);
  background: var(--paper-2);
}
.license-row input[type='radio'] {
  accent-color: var(--ink-100);
}
.license-title {
  font-size: 13px;
  color: var(--ink-100);
  flex: 1;
}

/* Review */
.review-card {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 32px;
  padding: 32px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: var(--bg-elevated);
}
.preview-cover {
  aspect-ratio: 2 / 3;
  background: var(--ink-100);
  color: var(--paper);
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 2px 6px 6px 2px;
  box-shadow: var(--shadow-book);
}
.pc-subject {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--paper-3);
  font-weight: 600;
}
.pc-title {
  font-size: 15px;
  margin-top: 12px;
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: -0.015em;
}
.pc-spacer {
  flex: 1;
}
.pc-meta {
  font-size: 9px;
  font-family: var(--font-mono);
  opacity: 0.7;
}
.review-title {
  font-size: 28px;
  color: var(--ink-100);
  font-weight: 500;
  line-height: 1.1;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.review-line {
  color: var(--ink-70);
  margin-bottom: 20px;
}
.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}
.review-val {
  color: var(--ink-100);
  font-size: 13px;
  margin-top: 2px;
}
.info-callout {
  padding: 14px;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  border-radius: 4px;
  display: flex;
  gap: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-70);
}
.info-icon {
  color: var(--ink-100);
  flex-shrink: 0;
  margin-top: 2px;
}

/* Confirm */
.confirm {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 24px;
  cursor: pointer;
}
.confirm-check {
  accent-color: var(--ink-100);
  margin-top: 3px;
}
.confirm-text {
  font-size: 13px;
  color: var(--ink-70);
  line-height: 1.55;
}

/* Success */
.success-card {
  padding: 40px 32px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--bg-elevated);
  text-align: center;
}
.success-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  display: grid;
  place-items: center;
  background: var(--ink-100);
  color: var(--paper);
  border-radius: 50%;
}
.success-title {
  font-size: 28px;
  color: var(--ink-100);
  font-weight: 500;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}
.success-sub {
  color: var(--ink-70);
  font-size: 14px;
  line-height: 1.55;
  max-width: 460px;
  margin: 0 auto 28px;
}

/* Upload error */
.upload-error {
  margin-top: 20px;
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

@media (max-width: 640px) {
  .upload {
    padding: 32px 20px;
  }
  .title {
    font-size: 34px;
  }
  .stepper {
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
  }
  .step {
    flex: auto;
  }
  .step-line {
    display: none;
  }
  .step-text {
    white-space: normal;
  }
  .dropzone {
    padding: 48px 20px;
  }
  .dz-title {
    font-size: 22px;
  }
  .file-chip {
    flex-wrap: wrap;
    gap: 10px;
  }
  .file-main {
    flex-basis: calc(100% - 60px);
  }
  .step-nav {
    gap: 12px;
  }
  .step-nav .btn {
    flex: 1;
    padding: 11px 8px;
    font-size: 13px;
  }
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }
  .review-card {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }
  .preview-cover {
    max-width: 180px;
  }
  .review-grid {
    grid-template-columns: 1fr;
  }
  .review-title {
    font-size: 24px;
  }
  .contrib-card {
    padding: 20px;
  }
}
</style>
