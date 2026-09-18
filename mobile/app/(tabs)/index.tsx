// Home — search-first landing (port of HomeView.vue).
// Serif masthead (day/night/season/weekday pools), glass SearchBar, scope
// pill, REAL stats (papers/subjects/courses/contributors from facets —
// no fake reads divisor), recently-added rail.
// Convex queries are live: new papers arrive without pull-to-refresh.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import * as Updates from 'expo-updates';
import Animated, { FadeIn } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { api } from '@/lib/convex';
import { useFacets, useOverlaidPapers, useScopedPages } from '@/lib/queries';
import { useOnboarding, useScope, useTrends, isLowData, useSession, firstNameOf } from '@/lib/store';
import { phraseFor, nextBoundaryMs, examCountdown } from '@shared/phrases';
import { filterPapers, rankPapers } from '@shared/search';
import { timeAgo, type Paper, type Subject } from '@shared/design';
import { getMyCourses, toggleMyCourse, clearMyCourses } from '@/lib/timetable';
import { getStreak, markReadingDay, type StreakInfo } from '@/lib/streaks';
import { upcomingExams, daysUntil, removeExam, type ExamEntry } from '@/lib/exams';
import { SearchBar } from '@/components/SearchBar';
import { ScopePill } from '@/components/ScopePill';
import { PaperCard } from '@/components/PaperCard';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState, OfflineBadge } from '@/components/states';
import { AmbientGrain } from '@/components/Grain';
import { HeroMark } from '@/components/HeroMark';
import { BrandMark } from '@/components/BrandMark';
import { Ornament } from '@/components/Ornament';
import { useNet } from '@/lib/net';
import { downloadPaper, getPrefetchEnabled, isDownloaded, resolvePaperUrl } from '@/lib/downloads';
import { getCachedPaper } from '@/lib/cache';
import { getRecents, type RecentEntry } from '@/lib/recents';
import { enqueue } from '@/lib/outbox';
import { track } from '@/lib/analytics';
import { toast } from '@/components/Toast';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { Icon } from '@/icons/icons';

export default function Home() {
  const c = useThemeColors();
  const router = useRouter();
  const facets = useFacets();
  const { results, status } = useScopedPages();
  const bumpLocal = useTrends((s) => s.bumpLocal);
  const reopen = useOnboarding((s) => s.reopen);
  const profile = useSession((s) => s.profile);
  const recordTrend = useMutation(api.trends.record);
  const [query, setQuery] = useState('');
  const [phrase, setPhrase] = useState(() => phraseFor(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState<StreakInfo>(() => getStreak());
  const [exams, setExams] = useState<ExamEntry[]>(() => upcomingExams(3));
  const { online, wifi } = useNet();
  const { program, levelYear } = useScope();
  const scrollRef = useRef<ScrollView>(null);
  const searchingRef = useRef(false);
  // Day/night accent follows the masthead's own rhythm (night owls included).
  const isNight = (() => {
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  })();

  // Clip results into view the moment typing starts: nudge the list up so
  // the live matches clear the keyboard zone.
  useEffect(() => {
    const active = query.trim().length >= 2;
    if (active && !searchingRef.current) {
      searchingRef.current = true;
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 200, animated: true });
      }, 80);
      return () => clearTimeout(t);
    }
    if (!active) searchingRef.current = false;
    return undefined;
  }, [query]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          setPhrase(phraseFor(new Date()));
          schedule();
        },
        Math.max(1000, nextBoundaryMs(new Date()) - Date.now()),
      );
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  const subjects: Subject[] = useMemo(() => {
    if (!facets) return [];
    const byId = new Map(facets.subjects.map((s) => [s.id, { ...s, courses: [] as never[] }]));
    for (const course of facets.courses) {
      const s = byId.get(course.subjectId);
      if (s) (s.courses as unknown[]).push(course);
    }
    return [...byId.values()] as Subject[];
  }, [facets]);

  const recentBase = useMemo(
    () =>
      [...(results as Paper[])]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 10),
    [results],
  );
  const recent = useOverlaidPapers(recentBase);

  // Streak ticks whenever the user comes back from reading something.
  useFocusEffect(
    useCallback(() => {
      setStreak(markReadingDay());
      setExams(upcomingExams(3));
    }, []),
  );

  const commitSearch = (q: string) => {
    bumpLocal(q.toLowerCase());
    track('search_commit', { len: q.length });
    void recordTrend({ term: q }).catch(() =>
      enqueue({ kind: 'trend', term: q.toLowerCase(), count: 1 }),
    );
    router.navigate({ pathname: '/(tabs)/search', params: { q } });
  };

  const countdown = useMemo(() => examCountdown(new Date()), []);

  const [myCourses, setMyCourses] = useState<string[]>(() => getMyCourses());
  const [editingCourses, setEditingCourses] = useState(false);
  const semesterPapers = useMemo(() => {
    if (!myCourses.length) return [];
    const set = new Set(myCourses);
    return [...(results as Paper[])]
      .filter((p) => set.has(p.course))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 10);
  }, [results, myCourses]);

  const gstSubject = facets?.subjects.find((s) => s.id === 'general-studies');

  const openPaper = (p: Paper) => router.push(`/paper/${p.id}`);

  // Live top matches for the Home dropdown (tappable straight to details).
  const homeTop = useMemo(() => {
    if (query.trim().length < 2) return [];
    return rankPapers(filterPapers(results as Paper[], query, {}), query).slice(0, 5);
  }, [results, query]);

  const openTopResult = (p: Paper) => {
    void recordTrend({ term: query }).catch(() =>
      enqueue({ kind: 'trend', term: query.toLowerCase(), count: 1 }),
    );
    router.push(`/paper/${p.id}`);
  };

  // Recently viewed (refresh on return — recents update while reading).
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  useFocusEffect(
    useCallback(() => {
      setRecents(getRecents());
    }, []),
  );
  const continueList = useMemo(() => {
    const pool = results as Paper[];
    return recents
      .flatMap((r) => {
        const live = pool.find((p) => p.id === r.id) ?? getCachedPaper(r.id);
        return live ? [{ paper: live, at: r.at }] : [];
      })
      .slice(0, 6);
  }, [recents, results]);

  const surprise = () => {
    const pool = results as Paper[];
    if (!pool.length) {
      toast('Nothing loaded yet — pull to refresh');
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) {
      toast('Shuffling the shelves…');
      router.push(`/paper/${pick.id}`);
    }
  };

  // Wifi-only prefetch: top-5 recent-in-scope land on disk silently.
  // Runs once per scope+list; failures are silent by design.
  const prefetchKey = useRef('');
  useEffect(() => {
    if (!wifi || !getPrefetchEnabled() || isLowData() || recent.length === 0) return;
    const key = `${levelYear}/${program}:${recent
      .slice(0, 5)
      .map((p) => p.id)
      .join(',')}`;
    if (prefetchKey.current === key) return;
    prefetchKey.current = key;
    void (async () => {
      for (const p of recent.slice(0, 5)) {
        try {
          if (await isDownloaded(p.id)) continue;
          const url = await resolvePaperUrl(p);
          await downloadPaper({ id: p.id, ext: p.fileExt, url });
        } catch {
          // silent — prefetch never interrupts reading
        }
      }
    })();
  }, [wifi, recent, levelYear, program]);

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              // Convex live queries self-update; what needs a manual kick is
              // the OTA bundle check. Loader keeps spinning until it settles.
              if (!__DEV__ && Updates.isEnabled) {
                await Updates.checkForUpdateAsync().catch(() => null);
              }
              await new Promise((r) => setTimeout(r, 400));
            } finally {
              setRefreshing(false);
            }
          }}
        />
      }
    >
      <View style={{ maxWidth: 900, alignSelf: 'center', width: '100%', paddingHorizontal: spacing.gutter, paddingTop: 84, position: 'relative' }}>
        <AmbientGrain />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <BrandMark />
        </View>
        {profile ? (
          <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans, marginBottom: 12 }}>
            Welcome,{' '}
            <Text style={{ fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
              {firstNameOf(profile.name)}
            </Text>
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans }}>
              Welcome — browsing as guest.
            </Text>
            <Pressable
              onPress={() => {
                reopen();
                router.push('/onboarding');
              }}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi, textDecorationLine: 'underline' }}>
                Sign in
              </Text>
            </Pressable>
          </View>
        )}
        {!online ? (
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <OfflineBadge />
          </View>
        ) : null}
        <HeroMark night={isNight} />
        <Animated.View key={phrase} entering={FadeIn.duration(260)}>
          <Text
            accessibilityRole="header"
            style={{
              fontSize: 40,
              lineHeight: 44,
              color: c.textPrimary,
              fontFamily: fonts.serifItalic,
              textAlign: 'center',
            }}
          >
            {phrase}
          </Text>
        </Animated.View>

        <View style={{ marginTop: 32 }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onCommit={commitSearch}
            onSeeAll={(q) => router.navigate({ pathname: '/(tabs)/search', params: { q } })}
            topResults={homeTop}
            onOpenPaper={openTopResult}
            papers={recent}
            subjectNames={subjects.map((s) => s.name)}
            courseNames={facets?.courses.map((x) => x.displayName || x.name) ?? []}
          />
        </View>

        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <ScopePill onPress={reopen} />
          <Pressable
            onPress={surprise}
            accessibilityRole="button"
            accessibilityLabel="Open a random paper from your scope"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 999,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: c.ruleStrong,
              minHeight: 44,
            }}
          >
            <Icon name="sparkle" size={14} color={c.textSecondary} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              Surprise me
            </Text>
          </Pressable>
        </View>
        {countdown || streak.current > 0 ? (
          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {countdown ? (
              <View
                accessibilityRole="text"
                accessibilityLabel={countdown.live ? `Finals season, ${countdown.days} days left` : `Finals season in ${countdown.days} days`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: c.ink100,
                }}
              >
                <Icon name="clock" size={13} color={c.paper} />
                <Text style={{ fontSize: 11, color: c.paper, fontFamily: fonts.mono }}>
                  {countdown.live
                    ? `FINALS SZN · ${countdown.days}d LEFT`
                    : `FINALS SZN IN ${countdown.days}d — STOCK UP`}
                </Text>
              </View>
            ) : null}
            {streak.current > 0 ? (
              <View
                accessibilityRole="text"
                accessibilityLabel={`Reading streak: ${streak.current} days`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: c.ruleStrong,
                }}
              >
                <Text style={{ fontSize: 12 }}>
                  {streak.atRisk ? '⏳' : '🔥'}
                </Text>
                <Text style={{ fontSize: 11, color: c.textSecondary, fontFamily: fonts.mono }}>
                  {streak.current}d streak{streak.atRisk ? ' — read today!' : ''}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {exams.length > 0 ? (
          <View style={{ marginTop: 16, gap: 8 }}>
            {exams.map((e) => {
              const d = daysUntil(e.at);
              const urgent = d <= 7;
              return (
                <View
                  key={e.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: urgent ? c.ink100 : c.rule,
                    borderRadius: 10,
                    backgroundColor: c.elevated,
                  }}
                >
                  <View style={{ width: 44, alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: urgent ? c.textPrimary : c.textSecondary, fontFamily: fonts.sansSemi }}>
                      {d}
                    </Text>
                    <Text style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, color: c.textTertiary, fontFamily: fonts.sans }}>days</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                      {e.course}
                    </Text>
                    <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 2 }}>
                      {new Date(e.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {d === 0 ? ' · TODAY' : d === 1 ? ' · TOMORROW' : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push('/(tabs)/search?focus=1')}
                    accessibilityRole="button"
                    accessibilityLabel={`Find ${e.course} past questions`}
                    style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: c.ruleStrong, minHeight: 40, justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 12, color: c.textPrimary, fontFamily: fonts.sansMedium }}>Past Qs</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      removeExam(e.id);
                      setExams(upcomingExams(3));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${e.course} exam`}
                    style={{ minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="x" size={14} color={c.textQuiet} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      {continueList.length > 0 ? (
        <View style={{ maxWidth: 900, alignSelf: 'center', width: '100%', paddingHorizontal: spacing.gutter, marginTop: 44 }}>
          <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
            Recently viewed
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 16 }}>
            Pick up where you left off
          </Text>
          <FlashList
            horizontal
            data={continueList}
            keyExtractor={(p) => `continue-${p.paper.id}`}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
            renderItem={({ item, index }) => (
              <View style={{ width: 120 }}>
                <PaperCard paper={item.paper} size="sm" index={index} onPress={() => openPaper(item.paper)} />
                <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 6 }}>
                  {timeAgo(item.at)}
                </Text>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={{ height: 48 }} />
      )}

      <View style={{ maxWidth: 900, alignSelf: 'center', width: '100%', paddingHorizontal: spacing.gutter, marginTop: 44 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
          <View>
            <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
              Timetable
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              This semester
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {editingCourses && myCourses.length > 0 ? (
              <Pressable
                onPress={() => {
                  clearMyCourses();
                  setMyCourses([]);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear all my courses"
                style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 13, color: c.error, fontFamily: fonts.sans }}>Clear all</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setEditingCourses(!editingCourses)}
              accessibilityRole="button"
              accessibilityLabel={editingCourses ? 'Done editing courses' : 'Choose my courses'}
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>
                {editingCourses ? 'Done' : myCourses.length ? 'Edit courses' : 'Pick courses'}
              </Text>
            </Pressable>
          </View>
        </View>
        {editingCourses || myCourses.length === 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 4 }}>
            {(facets?.courses ?? []).slice(0, 18).map((x) => {
              const active = myCourses.includes(x.id);
              return (
                <Pressable
                  key={x.id}
                  onPress={() => {
                    const selected = toggleMyCourse(x.id);
                    setMyCourses((prev) =>
                      selected
                        ? prev.includes(x.id)
                          ? prev
                          : [...prev, x.id]
                        : prev.filter((y) => y !== x.id),
                    );
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={x.displayName}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: active ? 999 : 4,
                    backgroundColor: active ? c.ink100 : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? c.ink100 : c.ruleStrong,
                    minHeight: 44,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '500', color: active ? c.paper : c.textSecondary, fontFamily: fonts.sansMedium }}>
                    {x.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {semesterPapers.length > 0 ? (
          <FlashList
            horizontal
            data={semesterPapers}
            keyExtractor={(p) => `semester-${p.id}`}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
            renderItem={({ item, index }) => (
              <View style={{ width: 120 }}>
                <PaperCard paper={item} size="sm" index={index} onPress={() => openPaper(item)} />
              </View>
            )}
          />
        ) : (
          <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 4 }}>
            {myCourses.length
              ? 'Nothing here yet — papers land as the scope syncs.'
              : 'Pick your courses and this shelf fills itself.'}
          </Text>
        )}
      </View>

      {gstSubject && gstSubject.count > 0 ? (
        <View style={{ maxWidth: 900, alignSelf: 'center', width: '100%', paddingHorizontal: spacing.gutter, marginTop: 32 }}>
          <Pressable
            onPress={() => router.push(`/subject/${gstSubject.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Open the GST survival kit"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: c.rule,
              borderRadius: 12,
              backgroundColor: c.elevated,
              minHeight: 76,
            }}
          >
            <Icon name="star" size={22} color={c.textPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
                GST survival kit
              </Text>
              <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>
                {gstSubject.count} papers everyone takes →
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <View style={{ maxWidth: 900, alignSelf: 'center', width: '100%', paddingHorizontal: spacing.gutter, marginTop: 40 }}>
        <Ornament />
      </View>

      <View style={{ maxWidth: 900, alignSelf: 'center', width: '100%', paddingHorizontal: spacing.gutter, marginTop: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
              This week
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              Recently added
            </Text>
          </View>
          <Pressable
            onPress={() => router.navigate('/(tabs)/browse')}
            accessibilityRole="button"
            accessibilityLabel="View all papers"
            style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>View all →</Text>
          </Pressable>
        </View>

        {status === 'LoadingFirstPage' && recent.length === 0 ? (
          <View style={{ flexDirection: 'row', gap: 24 }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} coverWidth={120} />
            ))}
          </View>
        ) : recent.length ? (
          <FlashList
            horizontal
            data={recent}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
            renderItem={({ item, index }) => (
              <View style={{ width: 120 }}>
                <PaperCard paper={item} size="sm" index={index} onPress={() => openPaper(item)} />
              </View>
            )}
          />
        ) : (
          <EmptyState title="No papers yet." sub="Try a different scope in Settings." icon="books" />
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}
