// Search — full-facet search with highlighted matches (port of SearchView).
// Server pages accumulate per scope; ranking/sorts apply client-side over
// loaded pages (documented v1 contract). Facets in ONE sheet; sorts inline;
// infinite scroll pages the scope. Commits record trends exactly once.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { useFacets, useOverlaidPapers, useSearchPages } from '@/lib/queries';
import { useTrends } from '@/lib/store';
import { filterPapers, rankPapers } from '@shared/search';
import { formatCount, type Paper } from '@shared/design';
import { SearchBar } from '@/components/SearchBar';
import { FacetSheet } from '@/components/FacetSheet';
import { HighlightText } from '@/components/HighlightText';
import { IndexStack } from '@/components/IndexStack';
import { SkeletonRow } from '@/components/Skeleton';
import { EmptyState, OfflineBadge } from '@/components/states';
import { useDockScrollWiring } from '@/motion/dockScroll';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useNet } from '@/lib/net';
import { enqueue } from '@/lib/outbox';
import { track } from '@/lib/analytics';
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '@/lib/searchHistory';

const DockFlatList = Animated.FlatList;

type Sort = 'relevance' | 'newest' | 'votes' | 'downloads';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'relevance', label: 'Most relevant' },
  { id: 'newest', label: 'Newest' },
  { id: 'votes', label: 'Most upvoted' },
  { id: 'downloads', label: 'Most downloaded' },
];

export default function Search() {
  const c = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; focus?: string }>();
  const facets = useFacets();
  const bumpLocal = useTrends((s) => s.bumpLocal);
  const recordTrend = useMutation(api.trends.record);

  const paramQ = typeof params.q === 'string' ? params.q : '';
  // Render-adjust pattern (not an effect): deep-link query becomes state.
  const [query, setQuery] = useState(paramQ);
  const [prevParamQ, setPrevParamQ] = useState(paramQ);
  if (paramQ !== prevParamQ) {
    setPrevParamQ(paramQ);
    setQuery(paramQ);
  }

  const [selSubjects, setSelSubjects] = useState<string[]>([]);
  const [selTypes, setSelTypes] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>('relevance');
  // True once the user (not the bounds fix above) edits year state, so the
  // late-arriving real bounds never overwrite their choice.
  const [yearTouched, setYearTouched] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const listRef = useRef<FlatList>(null);
  const dockWire = useDockScrollWiring('search');

  // Server-side prefilter: debounce typing so the live query re-subscribes
  // at most every 300ms; commit/search-history still own instant states.
  const [serverQ, setServerQ] = useState(query);
  useEffect(() => {
    if (query === serverQ) return;
    const t = setTimeout(() => setServerQ(query), 300);
    return () => clearTimeout(t);
  }, [query, serverQ]);
  const { results, status, loadMore } = useSearchPages(serverQ);

  const yearBounds = useMemo(
    () => ({ min: facets?.yearMin ?? 2020, max: facets?.yearMax ?? new Date().getFullYear() }),
    [facets],
  );
  const [yearMin, setYearMin] = useState(yearBounds.min);
  const [yearMax, setYearMax] = useState(yearBounds.max);
  // Facets resolve AFTER first paint (async query); year state initialized
  // from the 2020/this-year fallback used to stay there forever, silently
  // excluding every paper older than 2020 once real bounds landed. Adopt the
  // real bounds once — but never clobber a range the user has customized.
  // Render-phase state adjustment (the sanctioned React pattern; refs would
  // violate the rules of render purity here).
  const [prevBounds, setPrevBounds] = useState(yearBounds);
  const boundsChanged =
    prevBounds.min !== yearBounds.min || prevBounds.max !== yearBounds.max;
  if (boundsChanged) {
    setPrevBounds(yearBounds);
    if (!yearTouched) {
      setYearMin(yearBounds.min);
      setYearMax(yearBounds.max);
    }
  }

  const ranked = useMemo(() => {
    // The server already substring-matched serverQ; local filterPapers still
    // applies for the freshly-typed window (pre-debounce) + facet filters.
    let out = filterPapers(results as Paper[], query, {
      subjects: selSubjects.length ? selSubjects : undefined,
      types: selTypes.length ? selTypes : undefined,
      yearMin,
      yearMax,
    });
    if (sort === 'relevance') out = rankPapers(out, query);
    else if (sort === 'newest') out = [...out].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    else if (sort === 'votes') out = [...out].sort((a, b) => b.upvotes - a.upvotes);
    else out = [...out].sort((a, b) => b.downloads - a.downloads);
    return out;
  }, [results, query, selSubjects, selTypes, yearMin, yearMax, sort]);

  // Real metrics overlaid (previously fetched and discarded).
  const list = useOverlaidPapers(ranked);

  const commit = (q: string) => {
    setQuery(q);
    bumpLocal(q.toLowerCase());
    track('search_commit', { len: q.length });
    addRecentSearch(q);
    setRecents(getRecentSearches());
    // Instant clip: snap the results into view on every commit.
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    void recordTrend({ term: q }).catch(() =>
      enqueue({ kind: 'trend', term: q.toLowerCase(), count: 1 }),
    );
  };

  const [recents, setRecents] = useState<string[]>(() => getRecentSearches());
  useFocusEffect(
    useCallback(() => {
      setRecents(getRecentSearches());
    }, []),
  );

  const applySuggestion = (t: string) => {
    setQuery(t);
    commit(t);
  };

  const loading = status === 'LoadingFirstPage';
  const { online } = useNet();

  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View key={paramQ || 'idle'} entering={FadeInDown.duration(280)}>
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: 64 }}>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 10 }}>
          Search
        </Text>
        <SearchBar
          value={query}
          onChange={setQuery}
          onCommit={commit}
          autoFocus={params.focus === '1'}
          papers={results as Paper[]}
          subjectNames={facets?.subjects.map((s) => s.name) ?? []}
          courseNames={facets?.courses.map((x) => x.displayName || x.name) ?? []}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 8, gap: 12 }}>
          <Text style={{ flex: 1, fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans }}>
            {/* While typing, the count reflects the stale serverQ — never
            claim it matches the visible query. */}
            {list.length.toLocaleString()} result{list.length === 1 ? '' : 's'}
            {query ? (
              <Text style={{ fontWeight: '600', color: c.textPrimary }}> “{query}”</Text>
            ) : null}
            {query.trim() !== serverQ.trim() ? (
              <Text style={{ color: c.textTertiary }}> …</Text>
            ) : null}
          </Text>
          {!online ? <OfflineBadge /> : null}
          <HapticPressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Show filters"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: c.borderStrong,
              minHeight: 44,
            }}
          >
            <Icon name="filter" size={14} color={c.textSecondary} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              Filters{(selSubjects.length + selTypes.length) > 0 ? ` (${selSubjects.length + selTypes.length})` : ''}
            </Text>
          </HapticPressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
          {SORTS.map((s) => {
            const active = sort === s.id;
            return (
              <HapticPressable
                key={s.id}
                onPress={() => setSort(s.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Sort by ${s.label}`}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  borderBottomWidth: active ? 2 : 0,
                  borderBottomColor: c.textPrimary,
                  minHeight: 44,
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? '600' : '400',
                    color: active ? c.textPrimary : c.textTertiary,
                    fontFamily: active ? fonts.sansSemi : fonts.sans,
                  }}
                >
                  {s.label}
                </Text>
              </HapticPressable>
            );
          })}
        </View>
      </View>
      </Animated.View>

      {!query.trim() && recents.length > 0 ? (
        <View style={{ paddingHorizontal: spacing.gutter, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ flex: 1, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi }}>
              Recent
            </Text>
            <HapticPressable
              onPress={() => {
                clearRecentSearches();
                setRecents([]);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear recent searches"
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 12, color: c.textSecondary, fontFamily: fonts.sans }}>Clear</Text>
            </HapticPressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {recents.map((t) => (
              <HapticPressable
                key={t}
                onPress={() => applySuggestion(t)}
                accessibilityRole="button"
                accessibilityLabel={`Search ${t} again`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: c.borderStrong,
                  minHeight: 44,
                }}
              >
                <Icon name="clock" size={12} color={c.textTertiary} />
                <Text numberOfLines={1} style={{ fontSize: 13, color: c.textPrimary, fontFamily: fonts.sansMedium, maxWidth: 200 }}>
                  {t}
                </Text>
              </HapticPressable>
            ))}
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <SkeletonRow count={5} />
        </View>
      ) : list.length ? (
        <DockFlatList
          ref={listRef}
          data={list}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          onScroll={dockWire.onScroll}
          scrollEventThrottle={dockWire.scrollEventThrottle}
          onEndReached={() => loadMore(50)}
          onEndReachedThreshold={0.5}
          renderItem={({ item: p }) => (
            <HapticPressable
              onPress={() => router.push(`/paper/${p.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${p.title}, ${p.type}`}
              style={{
                flexDirection: 'row',
                gap: 16,
                paddingVertical: 18,
                paddingHorizontal: spacing.gutter,
                borderBottomWidth: 1,
                borderBottomColor: c.borderDefault,
                alignItems: 'flex-start',
              }}
            >
              <IndexStack paper={p} size="xs" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: c.textSecondary, backgroundColor: c.bgDefault, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, fontFamily: fonts.sansMedium }}>
                    {p.subjectName}
                  </Text>
                  <Text style={{ fontSize: 11, color: c.textTertiary, paddingVertical: 3, fontFamily: fonts.sans }}>
                    {p.type}
                  </Text>
                </View>
                <HighlightText text={p.title} query={query} fontSize={17} />
                <Text numberOfLines={1} style={{ fontSize: 14, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>
                  {p.subtitle}
                </Text>
                <Text style={{ fontSize: 12, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 8 }}>
                  {p.contributorName} · {p.year} · {p.pages} pages
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontSize: 11, color: c.textPrimary, fontFamily: fonts.mono }}>
                  ▲ {formatCount(p.upvotes)}
                </Text>
                <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
                  {formatCount(p.downloads)}
                </Text>
              </View>
            </HapticPressable>
          )}
        />
      ) : (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <EmptyState
            title="No papers match those filters."
            sub="Try fewer filters or a different search."
            icon="search"
            art="search"
            ctaLabel="Reset filters"
            onCta={() => {
              setYearTouched(false);
              setSelSubjects([]);
              setSelTypes([]);
              setYearMin(yearBounds.min);
              setYearMax(yearBounds.max);
            }}
          />
          {facets && facets.subjects.length > 0 ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 10 }}>
                Or explore a department
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {facets.subjects.slice(0, 6).map((s) => (
                  <HapticPressable
                    key={s.id}
                    onPress={() => applySuggestion(s.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Search ${s.name}`}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: c.borderStrong,
                      minHeight: 44,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                      {s.name}
                    </Text>
                  </HapticPressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      )}

      {facets ? (
        <FacetSheet
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          facets={{ subjects: selSubjects, types: selTypes, yearMin, yearMax }}
          onChange={(f) => {
            setYearTouched(true);
            setSelSubjects(f.subjects);
            setSelTypes(f.types);
            setYearMin(f.yearMin);
            setYearMax(f.yearMax);
          }}
          onReset={() => {
            setYearTouched(false);
            setSelSubjects([]);
            setSelTypes([]);
            setYearMin(yearBounds.min);
            setYearMax(yearBounds.max);
          }}
          subjects={facets.subjects}
          yearBounds={yearBounds}
        />
      ) : null}
    </KeyboardAvoidingView>
    </View>
  );
}
