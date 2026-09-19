// Upload — 4-step contribution wizard (replaces the paused web placeholder).
// Pick (picker + client validation) → Details (validated form) → Review
// (estimate + cover preview) → Submitted (id + 24–48h + status tracking).
// Draft persists offline (MMKV) and resumes. Bytes POST to a minted storage
// URL; metadata creates a `pending` submission for moderators.
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, usePaginatedQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { getKV, type KV } from '@/lib/storage';
import { api } from '@/lib/convex';
import { getDeviceHash } from '@/lib/device';
import { useSession } from '@/lib/store';
import {
  CODE_SUBJECTS,
  DEFAULT_LICENSE,
  estimatePages,
  extFromName,
  formatBytes,
  hashString,
  levelYearOf,
  parseCourseName,
  slugify,
} from '@shared/catalogue';
import { PAPER_TYPES } from '@shared/design';
import { IndexStack } from '@/components/IndexStack';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { toast } from '@/components/Toast';
import { track } from '@/lib/analytics';
import { celebrate, checkMilestone } from '@/lib/milestones';

const storage: KV = getKV('bellsnotes-upload');
const DRAFT_KEY = 'upload.draft.v1';
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTS = ['pdf', 'docx', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'txt'];
const MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/*',
  'text/plain',
];
const LICENSES = [DEFAULT_LICENSE, 'CC BY 4.0', 'CC BY-SA 4.0', 'All rights reserved'];

interface Picked {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

interface Draft {
  title: string;
  program: string;
  course: string;
  teacher: string;
  type: string;
  year: string;
  license: string;
  name: string;
  email: string;
  college: string;
  semester: string;
}

const EMPTY_DRAFT: Draft = {
  title: '',
  program: 'CSC',
  course: '',
  teacher: '',
  type: 'Notes',
  year: String(new Date().getFullYear()),
  license: DEFAULT_LICENSE,
  name: '',
  email: '',
  college: '',
  semester: '',
};

function readDraft(): Draft {
  try {
    const raw = storage.getString(DRAFT_KEY);
    if (raw) return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Draft) };
  } catch {
    // ignore
  }
  return { ...EMPTY_DRAFT };
}

export default function Upload() {
  const c = useThemeColors();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<Picked | null>(null);
  const [fileError, setFileError] = useState('');
  const profileName = useSession((s) => s.profile?.name ?? '');
  const [draft, setDraft] = useState<Draft>(() => ({
    ...readDraft(),
    name: readDraft().name || profileName,
  }));
  const [uploading, setUploading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const mintUrl = useMutation(api.submissions.uploadUrl);
  const createSubmission = useMutation(api.submissions.create);
  const mySubs = usePaginatedQuery(
    api.submissions.mine,
    { deviceHash: getDeviceHash() },
    { initialNumItems: 20 },
  );

  useEffect(() => {
    try {
      storage.set(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // best-effort
    }
  }, [draft]);

  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const fileExt = file ? extFromName(file.name) : '';
  const courseInfo = useMemo(() => parseCourseName(draft.course), [draft.course]);
  const courseValid = courseInfo.code !== '' && courseInfo.number !== '';
  const subjectSlug = courseInfo.code
    ? slugify(CODE_SUBJECTS[courseInfo.code] || courseInfo.code)
    : 'general';
  const subjectName = courseInfo.code
    ? CODE_SUBJECTS[courseInfo.code] || courseInfo.code
    : 'General Studies';
  const detailsValid =
    draft.title.trim().length > 0 && courseValid && draft.type !== '' && file !== null;

  const pick = async () => {
    setFileError('');
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: MIME_TYPES,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const a = res.assets[0]!;
      const ext = extFromName(a.name);
      if (!ALLOWED_EXTS.includes(ext)) {
        setFileError(`.${ext || '?'} isn't accepted — PDF, DOCX, PPTX, images, or TXT.`);
        return;
      }
      if ((a.size ?? 0) > MAX_BYTES) {
        setFileError('That file is over 50MB — compress it and try again.');
        return;
      }
      setFile({ uri: a.uri, name: a.name, size: a.size ?? 0, mimeType: a.mimeType ?? 'application/octet-stream' });
      if (!draft.title.trim()) set({ title: a.name.replace(/\.[^.]+$/, '') });
    } catch {
      setFileError('Could not open the picker — try again.');
    }
  };

  const submit = async () => {
    if (!file || !detailsValid || uploading) return;
    setUploading(true);
    try {
      const { url } = await mintUrl();
      const { File } = await import('expo-file-system');
      const f = new File(file.uri);
      const post = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.mimeType },
        body: f as unknown as BodyInit,
      });
      if (!post.ok) throw new Error('Upload failed — check your connection.');
      const { storageId } = (await post.json()) as { storageId: string };
      const year = parseInt(draft.year, 10) || new Date().getFullYear();
      const res = await createSubmission({
        title: draft.title.trim(),
        subject: subjectSlug,
        subjectName,
        course: draft.course.trim(),
        courseName: draft.course.trim(),
        teacher: draft.teacher.trim() || undefined,
        type: draft.type,
        year,
        license: draft.license,
        contributorName: draft.name.trim() || 'Anonymous',
        contributorEmail: draft.email.trim() || undefined,
        college: draft.college.trim(),
        program: courseInfo.code,
        level: courseInfo.number,
        semester: draft.semester.trim() || undefined,
        fileExt,
        sizeBytes: file.size,
        storageId: storageId as Id<'_storage'>,
        deviceHash: getDeviceHash(),
      });
      try {
        storage.remove(DRAFT_KEY);
      } catch {
        // ignore
      }
      setSubmittedId(res.id);
      setStep(3);
      track('upload_submit', { type: draft.type });
      {
        const party = checkMilestone('uploads');
        if (party) celebrate(party);
        else toast('Submitted for review');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setUploading(false);
    }
  };

  const previewPaper = file
    ? {
        id: 'preview',
        title: draft.title.trim() || file.name,
        subtitle: draft.course.trim() || 'Course',
        subject: subjectSlug,
        subjectName,
        course: draft.course,
        courseName: draft.course,
        type: draft.type,
        year: parseInt(draft.year, 10) || new Date().getFullYear(),
        pages: estimatePages(file.size, hashString(file.name)),
        upvotes: 0,
        downvotes: 0,
        downloads: 0,
        views: 0,
        contributor: 'community',
        contributorName: draft.name.trim() || 'Anonymous',
        teacher: draft.teacher,
        cover: hashString(file.name) % 16,
        mimeType: file.mimeType,
        fileExt,
        sizeLabel: formatBytes(file.size),
        previewUrl: '',
        downloadUrl: '',
        createdAt: new Date().toISOString(),
        parents: [],
        college: draft.college,
        program: courseInfo.code,
        level: courseInfo.number,
        levelYear: levelYearOf(courseInfo.number),
        semester: draft.semester,
        deptSection: '',
        license: draft.license,
        fileId: 'preview',
      }
    : null;

  const inputStyle = {
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: c.textPrimary,
    fontFamily: fonts.sans,
    backgroundColor: c.bgElevated,
    minHeight: 48,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      <HapticPressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close upload" style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 8 }}>
        <Icon name="arrow-left" size={18} color={c.textSecondary} />
      </HapticPressable>
      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
        Contribute · Step {Math.min(step + 1, 4)} of 4
      </Text>
      <Text style={{ fontSize: 32, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 8 }}>
        {step === 0 ? 'Pick your file' : step === 1 ? 'Add details' : step === 2 ? 'Review' : 'Submitted'}
      </Text>
      {step === 0 ? (
        <View style={{ marginTop: 16 }}>
          <HapticPressable
            onPress={() => void pick()}
            accessibilityRole="button"
            accessibilityLabel="Pick a file to upload"
            style={{
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: c.borderStrong,
              borderRadius: 12,
              padding: 32,
              alignItems: 'center',
              backgroundColor: c.bgElevated,
              minHeight: 160,
              justifyContent: 'center',
            }}
          >
            <Icon name="upload" size={28} color={c.textSecondary} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 12 }}>
              {file ? file.name : 'Tap to choose a file'}
            </Text>
            <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 6 }}>
              PDF · DOCX · PPTX · images · TXT · ≤50MB
            </Text>
            {file ? (
              <Text style={{ fontSize: 12, color: c.textSecondary, fontFamily: fonts.mono, marginTop: 6 }}>
                {formatBytes(file.size)}
              </Text>
            ) : null}
          </HapticPressable>
          {fileError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <Icon name="info" size={14} color={c.error} />
              <Text style={{ fontSize: 13, color: c.error, fontFamily: fonts.sans }}>{fileError}</Text>
            </View>
          ) : null}
          <WizardNav
            nextLabel="Continue →"
            nextDisabled={!file}
            onNext={() => setStep(1)}
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ marginTop: 16, gap: 14 }}>
          <Field label="Title">
            <TextInput value={draft.title} onChangeText={(v) => set({ title: v })} placeholder="e.g. Thermodynamics problem set solutions" placeholderTextColor={c.textQuiet} accessibilityLabel="Paper title" style={inputStyle} />
          </Field>
          <Field label="Course code + number (e.g. MTH 103)">
            <TextInput value={draft.course} onChangeText={(v) => set({ course: v })} placeholder="CSC 200" placeholderTextColor={c.textQuiet} autoCapitalize="characters" accessibilityLabel="Course" style={[inputStyle, !courseValid && draft.course ? { borderColor: c.error } : null]} />
            {!courseValid && draft.course ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Icon name="info" size={12} color={c.error} />
                <Text style={{ fontSize: 12, color: c.error, fontFamily: fonts.sans }}>
                  Use a code + number like CSC 200 — it routes your paper to the right level.
                </Text>
              </View>
            ) : null}
          </Field>
          <Field label="Program">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Object.entries(CODE_SUBJECTS).slice(0, 20).map(([code, name]) => {
                  const active = draft.program === code;
                  return (
                    <HapticPressable
                      key={code}
                      onPress={() => set({ program: code })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={name}
                      style={{
                        paddingVertical: 9,
                        paddingHorizontal: 12,
                        borderRadius: active ? 999 : 4,
                        backgroundColor: active ? c.textPrimary : 'transparent',
                        borderWidth: 1,
                        borderColor: active ? c.textPrimary : c.borderStrong,
                        minHeight: 44,
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '500', color: active ? c.bgDefault : c.textSecondary, fontFamily: fonts.sansMedium }}>
                        {code}
                      </Text>
                    </HapticPressable>
                  );
                })}
              </View>
            </ScrollView>
          </Field>
          <Field label="Type">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PAPER_TYPES.map((t) => {
                const active = draft.type === t;
                return (
                  <HapticPressable
                    key={t}
                    onPress={() => set({ type: t })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t}
                    style={{
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      borderRadius: active ? 999 : 4,
                      backgroundColor: active ? c.textPrimary : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? c.textPrimary : c.borderStrong,
                      minHeight: 44,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '500', color: active ? c.bgDefault : c.textSecondary, fontFamily: fonts.sansMedium }}>
                      {t}
                    </Text>
                  </HapticPressable>
                );
              })}
            </View>
          </Field>
          <Field label="Teacher (optional)">
            <TextInput value={draft.teacher} onChangeText={(v) => set({ teacher: v })} placeholder="Prof. …" placeholderTextColor={c.textQuiet} accessibilityLabel="Teacher" style={inputStyle} />
          </Field>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Year">
                <TextInput value={draft.year} onChangeText={(v) => set({ year: v.replace(/[^0-9]/g, '').slice(0, 4) })} keyboardType="number-pad" accessibilityLabel="Year" style={inputStyle} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="College (optional)">
                <TextInput value={draft.college} onChangeText={(v) => set({ college: v })} placeholder="Engineering" placeholderTextColor={c.textQuiet} accessibilityLabel="College" style={inputStyle} />
              </Field>
            </View>
          </View>
          <Field label="License">
            <View style={{ gap: 8 }}>
              {LICENSES.map((l) => {
                const active = draft.license === l;
                return (
                  <HapticPressable
                    key={l}
                    onPress={() => set({ license: l })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={l}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, minHeight: 44 }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: active ? c.textPrimary : c.borderStrong, backgroundColor: active ? c.textPrimary : 'transparent' }} />
                    <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans }}>{l}</Text>
                  </HapticPressable>
                );
              })}
            </View>
          </Field>
          <Field label="Your name (shown on the paper)">
            <TextInput value={draft.name} onChangeText={(v) => set({ name: v })} placeholder="Anonymous" placeholderTextColor={c.textQuiet} accessibilityLabel="Your name" style={inputStyle} />
          </Field>
          <Field label="Email (private — only if moderators must reach you)">
            <TextInput value={draft.email} onChangeText={(v) => set({ email: v })} placeholder="you@example.com" placeholderTextColor={c.textQuiet} keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email" style={inputStyle} />
          </Field>
          <WizardNav backLabel="← File" onBack={() => setStep(0)} nextLabel="Review →" nextDisabled={!detailsValid} onNext={() => setStep(2)} />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          {previewPaper ? <IndexStack paper={previewPaper} size="lg" /> : null}
          <View style={{ alignSelf: 'stretch', marginTop: 20, borderWidth: 1, borderColor: c.borderDefault, borderRadius: 8, backgroundColor: c.bgElevated, padding: 16 }}>
            {[
              ['Title', draft.title.trim()],
              ['Course', `${draft.course.trim()} · ${subjectName}`],
              ['Type', draft.type],
              ['Size', file ? formatBytes(file.size) : '—'],
              ['License', draft.license],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.borderDefault }}>
                <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>{k}</Text>
                <Text style={{ fontSize: 13, color: c.textPrimary, fontFamily: fonts.sansMedium, textAlign: 'right', flex: 1, marginLeft: 16 }}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={{ alignSelf: 'stretch' }}>
            <WizardNav
              backLabel="← Details"
              onBack={() => setStep(1)}
              nextLabel={uploading ? 'Uploading…' : 'Submit for review'}
              nextDisabled={uploading || !detailsValid}
              onNext={() => void submit()}
            />
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Icon name="check" size={40} color={c.textPrimary} />
          <Text style={{ fontSize: 24, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 16, textAlign: 'center' }}>
            Submitted for review
          </Text>
          <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 8, textAlign: 'center' }}>
            Moderators review within 24–48 hours.{submittedId ? ` Ref ${submittedId.slice(-6)}.` : ''}
          </Text>
          <HapticPressable
            onPress={() => {
              setStep(0);
              setFile(null);
              setDraft({ ...EMPTY_DRAFT });
              router.navigate('/(tabs)/browse');
            }}
            accessibilityRole="button"
            accessibilityLabel="Back to the library"
            style={{ marginTop: 24, backgroundColor: c.textPrimary, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, minHeight: 52, justifyContent: 'center' }}
          >
            <Text style={{ color: c.bgDefault, fontWeight: '600', fontFamily: fonts.sansSemi }}>Back to the library</Text>
          </HapticPressable>

          <View style={{ alignSelf: 'stretch', marginTop: 32 }}>
            <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 12 }}>
              My submissions
            </Text>
            {mySubs.results.length === 0 ? (
              <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>
                {mySubs.status === 'LoadingFirstPage' ? 'Loading…' : 'Nothing else from this device yet.'}
              </Text>
            ) : (
              mySubs.results.map((s) => (
                <View key={s._id} style={{ borderWidth: 1, borderColor: c.borderDefault, borderRadius: 8, padding: 14, backgroundColor: c.bgElevated, marginBottom: 10 }}>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                    {s.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 4, textTransform: 'uppercase' }}>
                    {s.status}
                  </Text>
                  {s.note ? (
                    <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 6 }}>
                      Reviewer: {s.note}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      ) : null}
    </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View>
      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function WizardNav({
  backLabel,
  onBack,
  nextLabel,
  nextDisabled,
  onNext,
}: {
  backLabel?: string;
  onBack?: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  onNext: () => void;
}) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
      {backLabel && onBack ? (
        <HapticPressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          style={{ paddingVertical: 14, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: c.borderStrong, minHeight: 52, justifyContent: 'center' }}
        >
          <Text style={{ color: c.textPrimary, fontWeight: '500', fontFamily: fonts.sansMedium }}>{backLabel}</Text>
        </HapticPressable>
      ) : null}
      <HapticPressable
        onPress={onNext}
        disabled={nextDisabled}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        style={{
          flex: 1,
          backgroundColor: c.textPrimary,
          borderRadius: 8,
          paddingVertical: 14,
          alignItems: 'center',
          minHeight: 52,
          justifyContent: 'center',
          opacity: nextDisabled ? 0.4 : 1,
        }}
      >
        <Text style={{ color: c.bgDefault, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>{nextLabel}</Text>
      </HapticPressable>
    </View>
  );
}
