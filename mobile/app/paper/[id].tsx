// Paper detail — preview, citation, live discussion (port of PaperView).
// Reads bumped once per mount (debounced, offline-queued by client retry).
// Downloads resolve request-time URLs (never stored keys); community uploads
// resolve via submissions.getFile. Preview: inline Drive embed when online,
// downloaded copy via system viewer when cached. NO fake pager, NO disabled
// AI button, working Report sheet (replaces the dead web button).
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useMutation, useQuery } from 'convex/react';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import { FlashList } from '@shopify/flash-list';
import { api } from '@/lib/convex';
import { useMetrics, useOverlaidPapers, usePaper, useSearchPages } from '@/lib/queries';
import { useBookmarks, useScope, useSession, useVotes } from '@/lib/store';
import { getDeviceHash } from '@/lib/device';
import { downloadPaper, fileFor, resolvePaperUrl, touchOpened } from '@/lib/downloads';
import { touchRecent } from '@/lib/recents';
import { celebrate, checkMilestone } from '@/lib/milestones';
import { enqueue } from '@/lib/outbox';
import { buildCitations, type CitationStyle } from '@shared/citations';
import { timeAgo } from '@shared/design';
import type { Paper } from '@shared/design';
import { BookCover } from '@/components/BookCover';
import { PaperCard } from '@/components/PaperCard';
import { Avatar } from '@/components/Avatar';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { SafeGlass } from '@/components/SafeGlass';
import { EmptyState } from '@/components/states';
import { SkeletonRow } from '@/components/Skeleton';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { toast } from '@/components/Toast';
import { track } from '@/lib/analytics';
import { isOnlineNow } from '@/lib/net';
import { hapticLight, usePressScale } from '@/motion/motion';

type Tab = 'preview' | 'citation' | 'discussion';
type ReportReason = 'wrong-file' | 'copyright' | 'spam' | 'other';

const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: 'wrong-file', label: 'Wrong file' },
  { id: 'copyright', label: 'Copyright issue' },
  { id: 'spam', label: 'Spam' },
  { id: 'other', label: 'Something else' },
];

const CANONICAL_ORIGIN = 'https://calebslibrary.org';

// Single comment with optional reply action (replies nest one level only).
function CommentRow({
  comment,
  onReply,
}: {
  comment: { _id: string; author_name: string; body: string; created_at: number };
  onReply?: (id: string, name: string) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Avatar name={comment.author_name} size={32} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
            {comment.author_name}
          </Text>
          <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
            {timeAgo(comment.created_at)}
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans, lineHeight: 22 }}>
          {comment.body}
        </Text>
        {onReply ? (
          <Pressable
            onPress={() => onReply(comment._id, comment.author_name)}
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${comment.author_name}`}
            style={{ alignSelf: 'flex-start', paddingVertical: 8, minHeight: 40, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: c.textSecondary, fontFamily: fonts.sansMedium }}>
              Reply
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// Spring press wrapper for the thumb-zone actions (Download/Save/Share).
function ScaleButton({
  onPress,
  accessibilityLabel,
  disabled,
  style,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  style?: React.ComponentProps<typeof Pressable>['style'];
  children: React.ReactNode;
}) {
  const { animatedStyle, pressIn, pressOut } = usePressScale();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <Animated.View
        style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, animatedStyle]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function PaperDetail() {
  const c = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const paper = usePaper(id ?? '');
  const metrics = useMetrics(id ? [id] : []);
  const metric = metrics?.find((m) => m.paper_id === id);

  const [tab, setTab] = useState<Tab>('preview');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Reads: exactly once per mount (StrictMode double-effect guarded).
  const readRecorded = useRef(false);
  const bump = useMutation(api.metrics.bump);
  useEffect(() => {
    if (!id || readRecorded.current) return;
    readRecorded.current = true;
    track('paper_open', { paperId: id });
    touchRecent(id);
    void bump({ paper_id: id, kind: 'reads', delta: 1 }).catch(() =>
      enqueue({ kind: 'bump', paperId: id, metric: 'reads', delta: 1 }),
    );
  }, [id, bump]);

  // Votes: local mirror + server toggle (server computes exact deltas).
  // Voter scope rides along so in-scope votes can outweigh drive-by votes.
  const { program: voterProgram, levelYear: voterLevel } = useScope();
  const localVote = useVotes((s) => s.votes[id ?? ''] ?? 0);
  const setLocalVote = useVotes((s) => s.setVote);
  const toggleVote = useMutation(api.votes.toggle);
  const vote = (dir: 1 | -1) => {
    if (!id) return;
    const next = (localVote === dir ? 0 : dir) as 1 | 0 | -1;
    setLocalVote(id, next);
    void hapticLight();
    track('vote', { paperId: id, value: next });
    void toggleVote({
      paperId: id,
      deviceHash: getDeviceHash(),
      value: next,
      voterProgram: voterProgram === 'all' ? undefined : voterProgram,
      voterLevel: voterLevel === 'all' ? undefined : voterLevel,
    }).catch(() => {
      enqueue({ kind: 'vote', paperId: id, value: next });
      toast('Vote queued — will sync when online');
    });
  };

  // In-scope signal: upvotes from the viewer's own program.
  const paperVotes = useQuery(
    api.votes.byPaper,
    id ? { paperId: id } : 'skip',
  ) as { value: number; voterProgram?: string }[] | undefined;
  const inScopeVotes = (paperVotes ?? []).filter(
    (r) => r.value === 1 && voterProgram !== 'all' && r.voterProgram === voterProgram,
  ).length;

  // Save: MMKV bookmarks mirror.
  const savedIds = useBookmarks((s) => s.ids);
  const toggleSaved = useBookmarks((s) => s.toggle);
  const saved = id ? savedIds.includes(id) : false;

  // Share: idempotent short link → system sheet (fallback: canonical URL).
  const createLink = useMutation(api.shortLink.create);
  const share = async () => {
    if (!paper) return;
    const canonical = `${CANONICAL_ORIGIN}/paper/${paper.id}`;
    let short = canonical;
    try {
      const res = await createLink({ paper_id: paper.id, url: canonical });
      short = `${CANONICAL_ORIGIN}/s/${res.code}`;
    } catch {
      // shortener unavailable — share the canonical URL
    }
    try {
      await Share.share({ message: `${paper.title} — ${short}` });
      track('share_create', { paperId: paper.id });
    } catch {
      // dismissed
    }
  };

  // Download: resolve URL → resumable task with progress → bump on completion.
  const [dl, setDl] = useState<{ status: 'idle' | 'working' | 'done'; written: number; total: number }>({
    status: 'idle',
    written: 0,
    total: 0,
  });
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  // Render-adjust pattern (not an effect): one-shot cache probe per paper.
  const [checkedId, setCheckedId] = useState<string | null>(null);
  if (paper && checkedId !== paper.id) {
    setCheckedId(paper.id);
    try {
      const f = fileFor(paper.id, paper.fileExt);
      if (f.exists) {
        setCachedUri(f.uri);
        setDl({ status: 'done', written: 0, total: 0 });
      }
    } catch {
      // unreadable cache — download path handles it
    }
  }

  const resolveUrl = async (p: Paper): Promise<string> => resolvePaperUrl(p);

  const download = async () => {
    if (!paper || dl.status === 'working') return;
    setDl({ status: 'working', written: 0, total: 0 });
    try {
      const url = await resolveUrl(paper);
      const uri = await downloadPaper({
        id: paper.id,
        ext: paper.fileExt,
        url,
        sizeBytes: 0,
        onProgress: (written, total) => setDl({ status: 'working', written, total }),
      });
      setCachedUri(uri);
      setDl({ status: 'done', written: 0, total: 0 });
      touchOpened(paper.id);
      touchRecent(paper.id);
      track('download_complete', { paperId: paper.id });
      const party = checkMilestone('downloads');
      if (party) celebrate(party);
      void bump({ paper_id: paper.id, kind: 'downloads', delta: 1 }).catch(() =>
        enqueue({ kind: 'bump', paperId: paper.id, metric: 'downloads', delta: 1 }),
      );
      toast('Downloaded — available offline');
    } catch (e) {
      setDl({ status: 'idle', written: 0, total: 0 });
      toast(e instanceof Error ? e.message : 'Download failed');
    }
  };

  const openCached = async () => {
    if (!paper) return;
    const uri = cachedUri ?? (() => {
      try {
        const f = fileFor(paper.id, paper.fileExt);
        return f.exists ? f.uri : null;
      } catch {
        return null;
      }
    })();
    if (!uri) {
      void download();
      return;
    }
    touchOpened(paper.id);
    touchRecent(paper.id);
    try {
      if (!(await isOnlineNow())) track('offline_open', { paperId: paper.id });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: paper.title });
      } else {
        await WebBrowser.openBrowserAsync(uri);
      }
    } catch {
      toast('Could not open the file');
    }
  };

  // Discussion: live list (pinned first, then threaded) + 10s throttle composer.
  interface ThreadComment {
    _id: string;
    author_name: string;
    body: string;
    created_at: number;
    parentId?: string;
    pinned?: boolean;
  }
  const comments = useQuery(api.comments.list, id ? { paper_id: id } : 'skip') as
    | ThreadComment[]
    | undefined;
  const postComment = useMutation(api.comments.post);
  const [commentBody, setCommentBody] = useState('');
  const profileName = useSession((s) => s.profile?.name ?? '');
  const [commentName, setCommentName] = useState(profileName);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const lastPostAt = useRef(0);

  const pinnedComment = comments?.find((x) => x.pinned);
  const topComments = (comments ?? []).filter((x) => !x.parentId && x._id !== pinnedComment?._id);
  const repliesOf = (pid: string) =>
    (comments ?? []).filter((x) => x.parentId === pid);

  const submitComment = async () => {
    const body = commentBody.trim();
    if (!body || posting || !paper) return;
    if (Date.now() - lastPostAt.current < 10_000) {
      toast('Slow down — one comment per 10 seconds');
      return;
    }
    setPosting(true);
    const clientId = `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
    const author = commentName.trim() || 'Anonymous';
    const parentId = replyTo?.id;
    try {
      await postComment({
        paper_id: paper.id,
        author_name: author,
        body,
        parentId,
      });
      lastPostAt.current = Date.now();
      setCommentBody('');
      setReplyTo(null);
      track('comment_post', { paperId: paper.id });
      toast('Posted — thanks for discussing');
    } catch (e) {
      enqueue({ kind: 'comment', paperId: paper.id, author, body, parentId, clientId });
      setCommentBody('');
      setReplyTo(null);
      toast('Saved — will post when online');
      void e;
    } finally {
      setPosting(false);
    }
  };

  // Report: reason + optional details → reports.create.
  const [reason, setReason] = useState<ReportReason>('wrong-file');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const createReport = useMutation(api.reports.create);
  const submitReport = async () => {
    if (!paper || reporting) return;
    setReporting(true);
    const clientId = `r${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
    try {
      const res = await createReport({
        paperId: paper.id,
        reason,
        details: reportDetails.trim() || undefined,
        deviceHash: getDeviceHash(),
      });
      setReportOpen(false);
      setReportDetails('');
      toast(
        res.pendingCount >= 3
          ? 'Reported — flagged for urgent review, thanks'
          : 'Reported — moderators will review, thanks',
      );
    } catch (e) {
      enqueue({
        kind: 'report',
        paperId: paper.id,
        reason,
        details: reportDetails.trim() || undefined,
        clientId,
      });
      setReportOpen(false);
      setReportDetails('');
      toast('Saved — will report when online');
      void e;
    } finally {
      setReporting(false);
    }
  };

  // Citation: 4 cards + copy.
  const citations = useMemo(
    () =>
      paper
        ? buildCitations({
            contributorName: paper.contributorName,
            year: paper.year,
            title: paper.title,
            subtitle: paper.subtitle,
            paperId: paper.id,
          })
        : null,
    [paper],
  );
  const [copied, setCopied] = useState<string | null>(null);
  const copyText = async (label: string, text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(label);
      toast('Copied');
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast('Copy unavailable');
    }
  };

  // Related: same course first, then same subject, exclude self.
  const { results } = useSearchPages();
  const relatedBase = useMemo(() => {
    if (!paper) return [];
    const pool = (results as Paper[]).filter((p) => p.id !== paper.id);
    return [
      ...pool.filter((p) => p.course === paper.course),
      ...pool.filter((p) => p.course !== paper.course && p.subject === paper.subject),
    ].slice(0, 8);
  }, [results, paper]);
  const related = useOverlaidPapers(relatedBase);

  if (paper === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper, padding: spacing.gutter, paddingTop: 96 }}>
        <SkeletonRow count={4} />
      </View>
    );
  }
  if (paper === null) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper, padding: spacing.gutter, paddingTop: 96 }}>
        <EmptyState
          title="Paper not found."
          icon="books"
          ctaLabel="Browse the library"
          onCta={() => router.navigate('/(tabs)/browse')}
        />
      </View>
    );
  }

  const upvotes = metric?.upvotes ?? paper.upvotes;
  const downvotes = metric?.downvotes ?? paper.downvotes;
  const views = metric?.reads ?? paper.views;
  const pct = dl.total > 0 ? Math.round((dl.written / dl.total) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}>
          <Icon name="arrow-left" size={18} color={c.textSecondary} />
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
          <BookCover
            paper={paper}
            size="lg"
            progress={
              dl.status === 'working' && dl.total > 0 ? dl.written / dl.total : undefined
            }
            downloaded={!!cachedUri}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {[paper.subjectName, paper.type, String(paper.year)].map((t) => (
                <Text key={t} style={{ fontSize: 11, color: c.textSecondary, backgroundColor: c.paper2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, fontFamily: fonts.sansMedium }}>
                  {t}
                </Text>
              ))}
            </View>
            <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              {paper.title}
            </Text>
            <Text style={{ fontSize: 15, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 4 }}>
              {paper.subtitle}
            </Text>
            <Pressable
              onPress={() => router.push(`/profile/${paper.contributor}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${paper.contributorName}'s profile`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}
            >
              <Avatar name={paper.contributorName} size={28} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                {paper.contributorName}
              </Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 8 }}>
              {paper.pages} pages · {paper.fileExt.toUpperCase() || 'PDF'} · {views.toLocaleString()} views
            </Text>
          </View>
        </View>

        <SafeGlass style={{ borderRadius: 14, marginTop: 20, padding: 12, gap: 10 }}>
          <ScaleButton
            onPress={() => void (cachedUri ? openCached() : download())}
            accessibilityLabel={cachedUri ? 'Open downloaded copy' : dl.status === 'working' ? `Downloading ${pct} percent` : 'Download PDF'}
            disabled={dl.status === 'working'}
            style={{
              backgroundColor: c.ink100,
              borderRadius: 8,
              paddingVertical: 13,
              minHeight: 52,
              opacity: dl.status === 'working' ? 0.7 : 1,
            }}
          >
            <Icon name="download" size={16} color={c.paper} />
            <Text style={{ color: c.paper, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>
              {cachedUri ? 'Open downloaded copy' : dl.status === 'working' ? `Downloading… ${pct}%` : 'Download PDF'}
            </Text>
          </ScaleButton>
          {dl.status === 'working' ? (
            <View style={{ height: 4, borderRadius: 2, backgroundColor: c.rule, overflow: 'hidden' }}>
              <View style={{ width: `${pct}%`, height: 4, backgroundColor: c.ink100 }} />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ScaleButton
              onPress={() => {
                const s = toggleSaved(paper.id);
                track('save_toggle', { paperId: paper.id, saved: s });
                if (s) {
                  const n = useBookmarks.getState().ids.length;
                  const party = checkMilestone('saves', n);
                  if (party) celebrate(party);
                  else toast('Saved');
                } else {
                  toast('Removed from saved');
                }
              }}
              accessibilityLabel={saved ? 'Remove from saved' : 'Save paper'}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: saved ? c.ink100 : c.ruleStrong,
                backgroundColor: saved ? c.paper2 : 'transparent',
                borderRadius: 8,
                paddingVertical: 11,
                minHeight: 48,
              }}
            >
              <Icon name="bookmark" size={15} color={c.textPrimary} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </ScaleButton>
            <ScaleButton
              onPress={() => void share()}
              accessibilityLabel="Share paper"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: c.ruleStrong,
                borderRadius: 8,
                paddingVertical: 11,
                minHeight: 48,
              }}
            >
              <Icon name="share" size={15} color={c.textPrimary} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                Share
              </Text>
            </ScaleButton>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: c.ruleStrong,
              borderRadius: 8,
              padding: 4,
            }}
          >
            <Pressable
              onPress={() => vote(1)}
              accessibilityRole="button"
              accessibilityLabel="Upvote"
              accessibilityState={{ selected: localVote === 1 }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 6,
                backgroundColor: localVote === 1 ? c.ink100 : 'transparent',
                minHeight: 44,
              }}
            >
              <Icon name="arrow-up" size={14} color={localVote === 1 ? c.paper : c.textSecondary} />
              <Text style={{ fontSize: 13, color: localVote === 1 ? c.paper : c.textSecondary, fontFamily: fonts.mono }}>
                {upvotes}
              </Text>
            </Pressable>
            <View style={{ width: 1, height: 20, backgroundColor: c.rule }} />
            <Pressable
              onPress={() => vote(-1)}
              accessibilityRole="button"
              accessibilityLabel="Downvote"
              accessibilityState={{ selected: localVote === -1 }}
              style={{
                width: 56,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 6,
                backgroundColor: localVote === -1 ? c.ink100 : 'transparent',
                minHeight: 44,
              }}
            >
              <Icon name="arrow-down" size={14} color={localVote === -1 ? c.paper : c.textSecondary} />
              <Text style={{ fontSize: 11, color: localVote === -1 ? c.paper : c.textTertiary, fontFamily: fonts.mono }}>
                {downvotes}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setReportOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Report an issue"
            style={{ alignItems: 'center', paddingVertical: 10, minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans }}>Report an issue</Text>
          </Pressable>
          {voterProgram !== 'all' && inScopeVotes > 0 ? (
            <Text style={{ textAlign: 'center', fontSize: 11, color: c.textSecondary, fontFamily: fonts.mono }}>
              ▲ {inScopeVotes} in {voterProgram.toUpperCase()} — weighted for your scope
            </Text>
          ) : null}
        </SafeGlass>

        <View style={{ marginTop: 24 }}>
          <Segmented
            accessibilityLabel="Paper sections"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'preview', label: 'Preview' },
              { id: 'citation', label: 'Citation' },
              { id: 'discussion', label: `Discussion (${comments?.length ?? 0})` },
            ]}
          />
        </View>

        {tab === 'preview' ? (
          <View style={{ marginTop: 16 }}>
            {paper.previewUrl ? (
              <View style={{ height: 480, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: c.rule }}>
                <WebView
                  source={{ uri: paper.previewUrl }}
                  style={{ flex: 1 }}
                  accessibilityLabel="Document preview"
                />
              </View>
            ) : (
              <EmptyState title="No preview available." sub="Download the file to read it." icon="file" />
            )}
            <Text style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans }}>
              {cachedUri ? 'Downloaded copy available offline' : 'Download for offline reading'}
            </Text>
          </View>
        ) : null}

        {tab === 'citation' && citations ? (
          <View style={{ marginTop: 16, gap: 12 }}>
            {(Object.entries(citations) as [CitationStyle, string][]).map(([style, text]) => (
              <View key={style} style={{ borderWidth: 1, borderColor: c.rule, borderRadius: 8, padding: 16, backgroundColor: c.elevated }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi }}>
                    {style}
                  </Text>
                  <Pressable
                    onPress={() => void copyText(style, text)}
                    accessibilityRole="button"
                    accessibilityLabel={`Copy ${style} citation`}
                    style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 12, color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                      {copied === style ? 'Copied ✓' : 'Copy'}
                    </Text>
                  </Pressable>
                </View>
                <Text style={{ fontSize: style === 'BibTeX' ? 12 : 14, color: c.textPrimary, fontFamily: style === 'BibTeX' ? fonts.mono : fonts.sans, lineHeight: 22 }}>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {tab === 'discussion' ? (
          <View style={{ marginTop: 16 }}>
            {replyTo ? (
              <Pressable
                onPress={() => setReplyTo(null)}
                accessibilityRole="button"
                accessibilityLabel={`Cancel reply to ${replyTo.name}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 10,
                  alignSelf: 'flex-start',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: c.paper2,
                  borderWidth: 1,
                  borderColor: c.rule,
                  minHeight: 36,
                }}
              >
                <Text style={{ fontSize: 12, color: c.textSecondary, fontFamily: fonts.sansMedium }}>
                  Replying to {replyTo.name} ✕
                </Text>
              </Pressable>
            ) : null}
            <View style={{ borderWidth: 1, borderColor: c.rule, borderRadius: 8, backgroundColor: c.elevated, padding: 14, marginBottom: 16 }}>
              <TextInput
                value={commentBody}
                onChangeText={setCommentBody}
                placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Add to the discussion. A name is nice but not required.'}
                placeholderTextColor={c.textQuiet}
                multiline
                accessibilityLabel="Comment text"
                style={{ fontSize: 14, color: c.textPrimary, fontFamily: fonts.sans, minHeight: 60 }}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <TextInput
                  value={commentName}
                  onChangeText={setCommentName}
                  placeholder="Your name (optional)"
                  placeholderTextColor={c.textQuiet}
                  accessibilityLabel="Your name"
                  style={{ flex: 1, fontSize: 12, color: c.textSecondary, fontFamily: fonts.sans }}
                />
                <Pressable
                  onPress={() => void submitComment()}
                  disabled={posting || !commentBody.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Post comment"
                  style={{
                    backgroundColor: c.ink100,
                    borderRadius: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    opacity: posting || !commentBody.trim() ? 0.5 : 1,
                    minHeight: 44,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: c.paper, fontSize: 13, fontWeight: '600', fontFamily: fonts.sansSemi }}>
                    {posting ? 'Posting…' : 'Post'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {!comments ? (
              <SkeletonRow count={3} />
            ) : comments.length ? (
              <View>
                {pinnedComment ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: c.ink100,
                      borderRadius: 8,
                      backgroundColor: c.elevated,
                      padding: 14,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: 1.7,
                        fontWeight: '600',
                        color: c.textSecondary,
                        fontFamily: fonts.sansSemi,
                        marginBottom: 8,
                      }}
                    >
                      Pinned by moderators
                    </Text>
                    <CommentRow
                      comment={pinnedComment}
                      onReply={(id, name) => setReplyTo({ id, name })}
                    />
                  </View>
                ) : null}
                {topComments.map((cm) => (
                  <View key={cm._id}>
                    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.rule }}>
                      <View style={{ flex: 1 }}>
                        <CommentRow
                          comment={cm}
                          onReply={(id, name) => setReplyTo({ id, name })}
                        />
                      </View>
                    </View>
                    {repliesOf(cm._id).map((r) => (
                      <View
                        key={r._id}
                        style={{
                          flexDirection: 'row',
                          gap: 12,
                          paddingVertical: 12,
                          paddingLeft: 32,
                          borderBottomWidth: 1,
                          borderBottomColor: c.rule,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <CommentRow comment={r} onReply={undefined} />
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title="No discussion yet." sub="Be the first to add a note." icon="chat" />
            )}
          </View>
        ) : null}

        <Pressable
          onPress={() => setDetailsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Show details"
          style={{
            marginTop: 24,
            borderWidth: 1,
            borderColor: c.rule,
            borderRadius: 8,
            padding: 16,
            backgroundColor: c.elevated,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 56,
          }}
        >
          <Text style={{ flex: 1, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi }}>
            Details
          </Text>
          <Icon name="chevron" size={14} color={c.textTertiary} />
        </Pressable>

        {related.length > 0 ? (
          <View style={{ marginTop: 32 }}>
            <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 14 }}>
              Related
            </Text>
            <FlashList
              horizontal
              data={related}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
              renderItem={({ item, index }) => (
                <View style={{ width: 120 }}>
                  <PaperCard paper={item} size="sm" index={index} onPress={() => router.push(`/paper/${item.id}`)} />
                </View>
              )}
            />
          </View>
        ) : null}
      </View>

      <Sheet visible={detailsOpen} onClose={() => setDetailsOpen(false)} title="Details">
        {[
          ['Course', paper.courseName],
          ...(paper.teacher ? [['Professor', paper.teacher] as [string, string]] : []),
          ['Type', paper.type],
          ['Year', String(paper.year)],
          ['Pages', String(paper.pages)],
          ['Size', paper.sizeLabel],
          ['License', paper.license || 'CC BY-NC 4.0'],
          ['Uploaded', timeAgo(paper.createdAt)],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.rule }}>
            <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>{k}</Text>
            <Text style={{ fontSize: 12, color: c.textPrimary, fontFamily: fonts.mono, textAlign: 'right', flex: 1, marginLeft: 16 }}>{v}</Text>
          </View>
        ))}
      </Sheet>

      <Sheet visible={reportOpen} onClose={() => setReportOpen(false)} title="Report an issue">
        <Segmented
          accessibilityLabel="Report reason"
          value={reason}
          onChange={setReason}
          options={REPORT_REASONS}
        />
        <TextInput
          value={reportDetails}
          onChangeText={setReportDetails}
          placeholder="Details (optional, helps moderators act faster)"
          placeholderTextColor={c.textQuiet}
          multiline
          accessibilityLabel="Report details"
          style={{
            marginTop: 16,
            borderWidth: 1,
            borderColor: c.ruleStrong,
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            color: c.textPrimary,
            fontFamily: fonts.sans,
            minHeight: 80,
          }}
        />
        <Pressable
          onPress={() => void submitReport()}
          disabled={reporting}
          accessibilityRole="button"
          accessibilityLabel="Submit report"
          style={{
            marginTop: 16,
            backgroundColor: c.ink100,
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
            minHeight: 52,
            justifyContent: 'center',
            opacity: reporting ? 0.6 : 1,
          }}
        >
          <Text style={{ color: c.paper, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>
            {reporting ? 'Submitting…' : 'Submit report'}
          </Text>
        </Pressable>
      </Sheet>
    </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}
