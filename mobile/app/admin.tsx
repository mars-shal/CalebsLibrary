// Admin — passphrase-gated moderation (port of AdminView, extended).
// Queues: Comments | Submissions | Reports × Pending/Approved/Rejected.
// Passphrase in SecureStore (never MMKV), 5-tries/60s throttle,
// indistinguishable verified:false on failure. Every decision auto-logs
// server-side. Paginated throughout (never full-collect).
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { getKV, type KV } from '@/lib/storage';
import { api } from '@/lib/convex';
import { getDeviceHash } from '@/lib/device';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { EmptyState } from '@/components/states';
import { SkeletonRow } from '@/components/Skeleton';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { toast } from '@/components/Toast';
import { track } from '@/lib/analytics';

const settings: KV = getKV('bellsnotes-settings');
const ADMIN_FLAG = 'bellsnotes_admin';
const PASS_KEY = 'bellsnotes_pass';
const ATTEMPTS_KEY = 'bellsnotes_admin_attempts';

type Kind = 'comments' | 'submissions' | 'reports';
type StatusFilter = 'pending' | 'approved' | 'rejected';

function recentAttempts(): number[] {
  try {
    const all = JSON.parse(settings.getString(ATTEMPTS_KEY) ?? '[]') as number[];
    return all.filter((t) => Date.now() - t < 60_000);
  } catch {
    return [];
  }
}

interface CommentRow {
  _id: string;
  paper_id: string;
  author_name: string;
  body: string;
  status: string;
  created_at: number;
  note?: string;
}

interface SubmissionRow {
  _id: string;
  title: string;
  contributorName: string;
  courseName: string;
  subjectName: string;
  type: string;
  status: string;
  note?: string;
  createdAt: number;
}

interface ReportRow {
  _id: string;
  paperId: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: number;
}

export default function Admin() {
  const c = useThemeColors();
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(settings.getString(ADMIN_FLAG) === '1');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const convex = useConvex();

  const unlock = async () => {
    if (!pass.trim() || busy) return;
    if (recentAttempts().length >= 5) {
      toast('Too many tries — wait a minute');
      return;
    }
    setBusy(true);
    setWrong(false);
    try {
      settings.set(ATTEMPTS_KEY, JSON.stringify([...recentAttempts(), Date.now()]));
      // VERIFY against the server (the wrong-passphrase branch returns
      // verified:false with an empty page): any passphrase used to unlock
      // used to be accepted and only exploded later in the queue.
      const probe = await convex.query(api.comments.queuePage, {
        passphrase: pass,
        paginationOpts: { numItems: 1, cursor: null },
      });
      if (!probe.verified) {
        setWrong(true);
        setPass('');
        return;
      }
      await SecureStore.setItemAsync(PASS_KEY, pass);
      settings.set(ADMIN_FLAG, '1');
      setUnlocked(true);
    } catch {
      toast('Could not verify — check your connection');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync(PASS_KEY).catch(() => {});
    settings.remove(ADMIN_FLAG);
    setUnlocked(false);
    setPass('');
  };

  if (!unlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={{ padding: spacing.gutter, paddingTop: 120, alignItems: 'center', flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <HapticPressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', width: '100%' }}>
          <Icon name="arrow-left" size={18} color={c.textSecondary} />
        </HapticPressable>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.textPrimary, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 20 }}>
          <Icon name="shield" size={22} color={c.bgDefault} />
        </View>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
          Moderators only
        </Text>
        <Text style={{ fontSize: 30, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 8 }}>
          Enter passphrase
        </Text>
        <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans, textAlign: 'center', marginBottom: 24 }}>
          Ask an existing moderator for the current one — it rotates each semester.
        </Text>
        <TextInput
          value={pass}
          onChangeText={(v) => {
            setPass(v);
            setWrong(false);
          }}
          secureTextEntry
          placeholder="passphrase"
          placeholderTextColor={c.textQuiet}
          accessibilityLabel="Moderator passphrase"
          onSubmitEditing={() => void unlock()}
          style={{
            width: '100%',
            borderWidth: 1,
            borderColor: c.borderStrong,
            borderRadius: 8,
            padding: 13,
            fontSize: 15,
            color: c.textPrimary,
            fontFamily: fonts.sans,
            backgroundColor: c.bgElevated,
          }}
        />
        {wrong ? (
          <Text style={{ fontSize: 12, color: c.textPrimary, fontFamily: fonts.sans, marginTop: 10 }}>
            That&apos;s not the passphrase.
          </Text>
        ) : null}
        <HapticPressable
          onPress={() => void unlock()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Unlock moderation"
          style={{ marginTop: 16, width: '100%', backgroundColor: c.textPrimary, borderRadius: 8, paddingVertical: 13, alignItems: 'center', minHeight: 52, justifyContent: 'center', opacity: busy ? 0.6 : 1 }}
        >
          <Text style={{ color: c.bgDefault, fontWeight: '600', fontFamily: fonts.sansSemi }}>
            {busy ? 'Checking…' : 'Unlock'}
          </Text>
        </HapticPressable>
      </ScrollView>
      </KeyboardAvoidingView>
      </View>
    );
  }

  return <Queue signOut={() => void signOut()} onBadPass={() => setWrong(true)} />;
}

function Queue({ signOut, onBadPass }: { signOut: () => void; onBadPass: () => void }) {
  const c = useThemeColors();
  const router = useRouter();
  const convex = useConvex();
  const [passphrase, setPassphrase] = useState('');
  const [kind, setKind] = useState<Kind>('comments');
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void SecureStore.getItemAsync(PASS_KEY).then((v) => setPassphrase(v ?? ''));
  }, []);

  const resetQueue = () => {
    setCursor(null);
    setAcc([]);
    seenKey.current = '';
    setSelected(null);
  };
  // Paginated queues via direct queries (the {verified, page, isDone,
  // continueCursor} shape is accumulated manually — usePaginatedQuery only
  // unwraps bare {page,…} results, which these verified envelopes are not).
  const PAGE = 20;
  const [cursor, setCursor] = useState<string | null>(null);
  const [acc, setAcc] = useState<unknown[]>([]);
  const seenKey = useRef('');

  const cPage = useQuery(
    api.comments.queuePage,
    kind === 'comments' && passphrase
      ? { passphrase, paginationOpts: { numItems: PAGE, cursor } }
      : 'skip',
  ) as { verified: boolean; page: unknown[]; isDone: boolean; continueCursor: string } | undefined;
  const sPage = useQuery(
    api.submissions.list,
    kind === 'submissions' && passphrase
      ? {
          passphrase,
          status: status as 'pending' | 'approved' | 'rejected',
          paginationOpts: { numItems: PAGE, cursor },
        }
      : 'skip',
  ) as { verified: boolean; page: unknown[]; isDone: boolean; continueCursor: string } | undefined;
  const rPage = useQuery(
    api.reports.list,
    kind === 'reports' && passphrase
      ? {
          passphrase,
          status: status === 'pending' ? 'pending' : status === 'approved' ? 'reviewed' : 'dismissed',
          paginationOpts: { numItems: PAGE, cursor },
        }
      : 'skip',
  ) as { verified: boolean; page: unknown[]; isDone: boolean; continueCursor: string } | undefined;

  const live = kind === 'comments' ? cPage : kind === 'submissions' ? sPage : rPage;
  const liveKey = `${kind}:${status}:${cursor ?? 'root'}`;

  useEffect(() => {
    if (!live) return;
    if (live.verified === false) {
      onBadPass();
      signOut();
      return;
    }
    if (seenKey.current === liveKey) return;
    seenKey.current = liveKey;
    setAcc((prev) => (cursor ? [...prev, ...(live.page ?? [])] : [...(live.page ?? [])]));
  }, [live, liveKey, cursor, kind, onBadPass, signOut]);

  const decideComment = useMutation(api.comments.moderate);
  const decideSubmission = useMutation(api.submissions.decide);
  const decideReport = useMutation(api.reports.decide);

  const commentItems = (acc as unknown as (CommentRow & { pinned?: boolean })[]).filter((x) =>
    kind !== 'comments'
      ? false
      : status === 'pending'
        ? x.status === 'pending'
        : status === 'approved'
          ? x.status === 'approved'
          : x.status === 'rejected',
  );
  const submissionItems = (kind === 'submissions' ? acc : []) as unknown as SubmissionRow[];
  const reportItems = (kind === 'reports' ? acc : []) as unknown as ReportRow[];

  const loading = !live && acc.length === 0;

  const loadMore = () => {
    const c = kind === 'comments' ? cPage : kind === 'submissions' ? sPage : rPage;
    if (!c || (c as { isDone: boolean }).isDone) return;
    setCursor((c as { continueCursor: string }).continueCursor || null);
  };

  const activeList =
    kind === 'comments'
      ? commentItems.map((x) => ({
          id: String(x._id),
          title: x.body,
          sub: `${x.author_name} · on ${x.paper_id}`,
          status: x.status,
          pinned: !!x.pinned,
        }))
      : kind === 'submissions'
        ? submissionItems.map((x) => ({
            id: String(x._id),
            title: x.title,
            sub: `${x.contributorName} · ${x.courseName}`,
            status: x.status,
          }))
        : reportItems.map((x) => ({
            id: String(x._id),
            title: `${x.reason} — ${x.paperId}`,
            sub: x.details ?? 'No details',
            status: x.status,
          }));

  const selectedItem = activeList.find((x) => x.id === selected) ?? null;
  const selectedPinned =
    kind === 'comments' && selectedItem ? !!(selectedItem as { pinned?: boolean }).pinned : false;

  const togglePin = async () => {
    if (!selectedItem || busyId || kind !== 'comments') return;
    if (selectedItem.status !== 'approved') {
      toast('Only approved comments can be pinned');
      return;
    }
    setBusyId(selectedItem.id);
    try {
      await decideComment({
        passphrase,
        id: selectedItem.id as never,
        // Pin toggles preserve the comment's current status. The moderation
        // API only allows approved/rejected — a pending comment can't be the
        // pinned answer, so bounce that with a clear message.
        status: selectedItem.status === 'approved' ? 'approved' : 'rejected',
        pinned: !selectedPinned,
        deviceHash: getDeviceHash(),
      });
      toast(!selectedPinned ? 'Pinned as answer' : 'Unpinned');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusyId(null);
    }
  };

  const decide = async (approve: boolean) => {
    if (!selectedItem || busyId) return;
    setBusyId(selectedItem.id);
    try {
      const deviceHash = getDeviceHash();
      const n = note.trim() || undefined;
      if (kind === 'comments') {
        await decideComment({ passphrase, id: selectedItem.id as never, status: approve ? 'approved' : 'rejected', note: n, deviceHash });
      } else if (kind === 'submissions') {
        await decideSubmission({ passphrase, id: selectedItem.id as never, status: approve ? 'approved' : 'rejected', note: n, deviceHash });
      } else {
        await decideReport({ passphrase, id: selectedItem.id as never, status: approve ? 'reviewed' : 'dismissed', note: n, deviceHash });
      }
      setNote('');
      setSelected(null);
      track('upload_decide', { kind, action: approve ? 'approved' : 'rejected' });
      toast(approve ? 'Approved' : kind === 'reports' && !approve ? 'Dismissed' : 'Rejected');
    } catch (e) {
      if (e instanceof Error && e.message.toLowerCase().includes('passphrase')) {
        toast("That's not the passphrase");
        signOut();
      } else {
        toast(e instanceof Error ? e.message : 'Could not save');
      }
    } finally {
      setBusyId(null);
    }
  };

  const openSubmissionFile = async (subId: string) => {
    try {
      const f = await convex.query(api.submissions.getFile, { subId: `sub_${subId}` });
      if (!f) {
        toast('File unavailable');
        return;
      }
      await WebBrowser.openBrowserAsync(f.previewUrl || f.downloadUrl);
    } catch {
      toast('Could not open file');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 8 }}>
        <HapticPressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ minHeight: 44, justifyContent: 'center', marginBottom: 4 }}>
          <Icon name="arrow-left" size={18} color={c.textSecondary} />
        </HapticPressable>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
          Moderators · Signed in
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: 30, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
            Queue
          </Text>
          <HapticPressable onPress={signOut} accessibilityRole="button" accessibilityLabel="Sign out" style={{ padding: 10, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, color: c.textSecondary, fontFamily: fonts.sans }}>Sign out</Text>
          </HapticPressable>
        </View>
        <View style={{ marginTop: 12 }}>
          <Segmented
            accessibilityLabel="Queue type"
            value={kind}
            onChange={(k) => {
              setKind(k);
              resetQueue();
            }}
            options={[
              { id: 'comments', label: 'Comments' },
              { id: 'submissions', label: 'Submissions' },
              { id: 'reports', label: 'Reports' },
            ]}
          />
        </View>
        <View style={{ marginTop: 8 }}>
          <Segmented
            accessibilityLabel="Queue status"
            value={status}
            onChange={(s) => {
              setStatus(s);
              resetQueue();
            }}
            options={[
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: kind === 'reports' ? 'Reviewed' : 'Approved' },
              { id: 'rejected', label: kind === 'reports' ? 'Dismissed' : 'Rejected' },
            ]}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <SkeletonRow count={5} />
        </View>
      ) : activeList.length ? (
        <FlatList
          data={activeList}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 140 }}
          onEndReached={() => loadMore()}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <HapticPressable
              onPress={() => setSelected(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Review item ${index + 1}`}
              style={{
                paddingVertical: 14,
                paddingHorizontal: spacing.gutter,
                borderBottomWidth: 1,
                borderBottomColor: c.borderDefault,
                borderLeftWidth: 3,
                borderLeftColor: selected === item.id ? c.textPrimary : 'transparent',
                backgroundColor: selected === item.id ? c.bgDefault : 'transparent',
              }}
            >
              <Text style={{ fontSize: 10, color: c.textTertiary, fontFamily: fonts.mono, marginBottom: 4 }}>
                #{String(index + 1).padStart(4, '0')} · {item.status.toUpperCase()}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 4 }}>
                {item.sub}
              </Text>
            </HapticPressable>
          )}
        />
      ) : (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <EmptyState title="No items in this view." icon="shield" />
        </View>
      )}

      <Sheet visible={!!selectedItem} onClose={() => setSelected(null)} title="Review">
        {selectedItem ? (
          <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 16, color: c.textPrimary, fontFamily: fonts.sansMedium, lineHeight: 24 }}>
              {selectedItem.title}
            </Text>
            <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 8 }}>
              {selectedItem.sub}
            </Text>
            {kind === 'submissions' ? (
              <HapticPressable
                onPress={() => void openSubmissionFile(selectedItem.id)}
                accessibilityRole="button"
                accessibilityLabel="Open submitted file"
                style={{ marginTop: 12, paddingVertical: 12, minHeight: 48, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 13, color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                  Open submitted file →
                </Text>
              </HapticPressable>
            ) : null}
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note to the author (optional)…"
              placeholderTextColor={c.textQuiet}
              multiline
              accessibilityLabel="Reviewer note"
              style={{
                marginTop: 16,
                borderWidth: 1,
                borderColor: c.borderStrong,
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                color: c.textPrimary,
                fontFamily: fonts.sans,
                minHeight: 64,
                backgroundColor: c.bgElevated,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <HapticPressable
                onPress={() => void decide(false)}
                disabled={!!busyId}
                accessibilityRole="button"
                accessibilityLabel={kind === 'reports' ? 'Dismiss report' : 'Reject'}
                style={{ flex: 1, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 8, paddingVertical: 13, alignItems: 'center', minHeight: 52, justifyContent: 'center', opacity: busyId ? 0.5 : 1 }}
              >
                <Text style={{ fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                  {kind === 'reports' ? 'Dismiss' : 'Reject'}
                </Text>
              </HapticPressable>
              <HapticPressable
                onPress={() => void decide(true)}
                disabled={!!busyId}
                accessibilityRole="button"
                accessibilityLabel={kind === 'reports' ? 'Mark reviewed' : 'Approve'}
                style={{ flex: 1, backgroundColor: c.textPrimary, borderRadius: 8, paddingVertical: 13, alignItems: 'center', minHeight: 52, justifyContent: 'center', opacity: busyId ? 0.5 : 1 }}
              >
                <Text style={{ fontWeight: '600', color: c.bgDefault, fontFamily: fonts.sansSemi }}>
                  {kind === 'reports' ? 'Reviewed' : 'Approve'}
                </Text>
              </HapticPressable>
            </View>
            {kind === 'comments' ? (
              <HapticPressable
                onPress={() => void togglePin()}
                disabled={!!busyId}
                accessibilityRole="button"
                accessibilityLabel={selectedPinned ? 'Unpin answer' : 'Pin as answer'}
                style={{ marginTop: 10, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 48, justifyContent: 'center', opacity: busyId ? 0.5 : 1 }}
              >
                <Text style={{ fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                  {selectedPinned ? 'Unpin answer' : 'Pin as answer'}
                </Text>
              </HapticPressable>
            ) : null}
          </ScrollView>
        ) : null}
      </Sheet>
    </View>
  );
}
