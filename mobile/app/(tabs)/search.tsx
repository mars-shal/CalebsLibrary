// Search — full-facet search with highlighted matches (port of SearchView).
// Server pages accumulate per scope; ranking/sorts apply client-side over
// loaded pages (documented v1 contract). Facets in ONE sheet; sorts inline;
// infinite scroll pages the scope. Commits record trends exactly once.
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
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
import { BookCover } from '@/components/BookCover';
import { SkeletonRow } from '@/components/Skeleton';
import { EmptyState, OfflineBadge } from '@/components/states';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useNet } from '@/lib/net';
import { enqueue } from '@/lib/outbox';
import { track } from '@/lib/analytics';
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '@/lib/searchHistory';

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
  const { results, status, loadMore } = useSearchPages();
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const listRef = useRef<FlatList>(null);

  const yearBounds = useMemo(
    () => ({ min: facets?.yearMin ?? 2020, max: facets?.yearMax ?? new Date().getFullYear() }),
    [facets],
  );
  const [yearMin, setYearMin] = useState(yearBounds.min);
  const [yearMax, setYearMax] = useState(yearBounds.max);

  const ranked = useMemo(() => {
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
    <View style={{ flex: 1, backgroundColor: c.paper }}>
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
            {list.length.toLocaleString()} result{list.length === 1 ? '' : 's'}
            {query ? (
              <Text style={{ fontWeight: '600', color: c.textPrimary }}> “{query}”</Text>
            ) : null}
          </Text>
          {!online ? <OfflineBadge /> : null}
          <Pressable
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
              borderColor: c.ruleStrong,
              minHeight: 44,
            }}
          >
            <Icon name="filter" size={14} color={c.textSecondary} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              Filters{(selSubjects.length + selTypes.length) > 0 ? ` (${selSubjects.length + selTypes.length})` : ''}
            </Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
          {SORTS.map((s) => {
            const active = sort === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSort(s.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Sort by ${s.label}`}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  borderBottomWidth: active ? 2 : 0,
                  borderBottomColor: c.ink100,
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
              </Pressable>
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
            <Pressable
              onPress={() => {
                clearRecentSearches();
                setRecents([]);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear recent searches"
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 12, color: c.textSecondary, fontFamily: fonts.sans }}>Clear</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {recents.map((t) => (
              <Pressable
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
                  borderColor: c.ruleStrong,
                  minHeight: 44,
                }}
              >
                <Icon name="clock" size={12} color={c.textTertiary} />
                <Text numberOfLines={1} style={{ fontSize: 13, color: c.textPrimary, fontFamily: fonts.sansMedium, maxWidth: 200 }}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <SkeletonRow count={5} />
        </View>
      ) : list.length ? (
        <FlatList
          ref={listRef}
          data={list}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => loadMore(50)}
          onEndReachedThreshold={0.5}
          renderItem={({ item: p }) => (
            <Pressable
              onPress={() => router.push(`/paper/${p.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${p.title}, ${p.type}`}
              style={{
                flexDirection: 'row',
                gap: 16,
                paddingVertical: 18,
                paddingHorizontal: spacing.gutter,
                borderBottomWidth: 1,
                borderBottomColor: c.rule,
                alignItems: 'flex-start',
              }}
            >
              <BookCover paper={p} size="xs" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: c.textSecondary, backgroundColor: c.paper2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, fontFamily: fonts.sansMedium }}>
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
            </Pressable>
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
                  <Pressable
                    key={s.id}
                    onPress={() => applySuggestion(s.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Search ${s.name}`}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: c.ruleStrong,
                      minHeight: 44,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                      {s.name}
                    </Text>
                  </Pressable>
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
            setSelSubjects(f.subjects);
            setSelTypes(f.types);
            setYearMin(f.yearMin);
            setYearMax(f.yearMax);
          }}
          onReset={() => {
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
