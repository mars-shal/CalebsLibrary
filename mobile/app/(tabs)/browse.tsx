// Browse — cover-forward shelves grouped by subject (port of BrowseView).
// ONE filter sheet (subject/course/type/year/sort). Shelves hide when empty.
// Vertical FlatList of shelves (each a horizontal FlashList ≤24); outer
// onEndReached pages the scope. Shelf headers → subject screens (Phase 3:
// subject + course ship here to avoid dead ends).
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useFacets, useOverlaidPapers, useScopedPages } from '@/lib/queries';
import { type Paper } from '@shared/design';
import { PaperCard } from '@/components/PaperCard';
import { SpotArt } from '@/components/SpotArt';
import { FilterSheet, type BrowseFilters } from '@/components/FilterSheet';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState, OfflineBadge } from '@/components/states';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useNet } from '@/lib/net';

export default function Browse() {
  const c = useThemeColors();
  const router = useRouter();
  const facets = useFacets();
  const { results, status, loadMore } = useScopedPages();
  const liveResults = useOverlaidPapers(results as Paper[]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>({
    subject: 'all',
    course: 'all',
    types: [],
    yearMin: 2020,
    yearMax: new Date().getFullYear(),
    sort: 'dept',
  });

  const yearBounds = useMemo(
    () => ({ min: facets?.yearMin ?? 2020, max: facets?.yearMax ?? new Date().getFullYear() }),
    [facets],
  );

  const shelves = useMemo(() => {
    const list = liveResults.filter(
      (p) =>
        (filters.subject === 'all' || p.subject === filters.subject) &&
        (filters.course === 'all' || p.course === filters.course) &&
        (!filters.types.length || filters.types.includes(p.type)) &&
        p.year >= filters.yearMin &&
        p.year <= filters.yearMax,
    );
    const sortFn = (arr: Paper[]): Paper[] => {
      switch (filters.sort) {
        case 'course':
          return [...arr].sort((a, b) => a.courseName.localeCompare(b.courseName));
        case 'year-new':
          return [...arr].sort((a, b) => b.year - a.year);
        case 'year-old':
          return [...arr].sort((a, b) => a.year - b.year);
        case 'reads':
          return [...arr].sort((a, b) => b.views - a.views);
        case 'upvotes':
          return [...arr].sort((a, b) => b.upvotes - a.upvotes);
        default:
          return arr;
      }
    };
    const names = new Map((facets?.subjects ?? []).map((s) => [s.id, s.name]));
    const groups = new Map<string, Paper[]>();
    for (const p of list) {
      const g = groups.get(p.subject) ?? [];
      g.push(p);
      groups.set(p.subject, g);
    }
    const ordered =
      filters.sort === 'dept'
        ? [...groups.entries()].sort((a, b) =>
            (names.get(a[0]) ?? a[0]).localeCompare(names.get(b[0]) ?? b[0]),
          )
        : [...groups.entries()];
    return ordered.map(([subjectId, papers]) => ({
      subjectId,
      name: names.get(subjectId) ?? subjectId,
      papers: sortFn(papers),
    }));
  }, [liveResults, filters, facets]);

  const total = shelves.reduce((n, s) => n + s.papers.length, 0);
  const loading = status === 'LoadingFirstPage' && (results as Paper[]).length === 0;
  const { online } = useNet();
  const shelfListRef = useRef<FlatList>(null);

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 12 }}>
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <SpotArt name="shelf" size={104} />
        </View>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
          The library
        </Text>
        <Text style={{ fontSize: 34, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
          Everything, sorted by subject.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: c.ruleStrong,
              minHeight: 44,
            }}
          >
            <Icon name="filter" size={14} color={c.textSecondary} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              Filter
            </Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
            {total.toLocaleString()} papers
          </Text>
          {!online ? <OfflineBadge /> : null}
        </View>
        {shelves.length > 1 ? (
          <FlatList
            horizontal
            data={shelves}
            keyExtractor={(s) => `jump-${s.subjectId}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: 8, paddingBottom: 12 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => {
                  try {
                    shelfListRef.current?.scrollToIndex({ index, viewPosition: 0, animated: true });
                  } catch {
                    // onScrollToIndexFailed covers unmeasured rows
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`Jump to ${item.name}`}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: c.ruleStrong,
                  minHeight: 40,
                  justifyContent: 'center',
                }}
              >
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '500', color: c.textSecondary, fontFamily: fonts.sansMedium, maxWidth: 140 }}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        ) : null}
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.gutter, gap: 40 }}>
          {[0, 1].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 20 }}>
              {[0, 1, 2].map((j) => (
                <SkeletonCard key={j} coverWidth={120} />
              ))}
            </View>
          ))}
        </View>
      ) : !total ? (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <EmptyState
            title="These shelves are empty"
            sub="Try loosening your filters."
            icon="books"
            ctaLabel="Reset filters"
            onCta={() =>
              setFilters({
                subject: 'all',
                course: 'all',
                types: [],
                yearMin: yearBounds.min,
                yearMax: yearBounds.max,
                sort: 'dept',
              })
            }
          />
        </View>
      ) : (
        <FlatList
          ref={shelfListRef}
          data={shelves}
          keyExtractor={(s) => s.subjectId}
          contentContainerStyle={{ paddingBottom: 140 }}
          onEndReached={() => loadMore(20)}
          onEndReachedThreshold={0.5}
          onScrollToIndexFailed={(info) => {
            // Unmeasured rows: nudge, then retry once at the averaged offset.
            setTimeout(() => {
              try {
                shelfListRef.current?.scrollToOffset({
                  offset: Math.max(0, info.index * info.averageItemLength - 100),
                  animated: true,
                });
              } catch {
                // ignore
              }
            }, 60);
          }}
          renderItem={({ item: shelf }) => (
            <View style={{ marginBottom: 48 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.gutter, marginBottom: 16, gap: 12 }}>
                <Pressable onPress={() => router.push(`/subject/${shelf.subjectId}`)} accessibilityRole="button" accessibilityLabel={`Open ${shelf.name}`}>
                  <Text style={{ fontSize: 20, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                    {shelf.name}
                  </Text>
                </Pressable>
                <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
                  {shelf.papers.length} papers
                </Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => router.push(`/subject/${shelf.subjectId}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${shelf.name} department`}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>Open →</Text>
                </Pressable>
              </View>
              <FlashList
                horizontal
                data={shelf.papers.slice(0, 24)}
                keyExtractor={(p: Paper) => p.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.gutter }}
                ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
                renderItem={({ item, index }: { item: Paper; index: number }) => (
                  <View style={{ width: 120 }}>
                    <PaperCard paper={item} size="sm" index={index} onPress={() => router.push(`/paper/${item.id}`)} />
                  </View>
                )}
              />
              <View style={{ height: 4, backgroundColor: c.ink100, marginTop: 20, marginHorizontal: spacing.gutter, opacity: 0.9 }} />
            </View>
          )}
        />
      )}

      {facets ? (
        <FilterSheet
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filters={filters}
          onChange={setFilters}
          onReset={() =>
            setFilters({
              subject: 'all',
              course: 'all',
              types: [],
              yearMin: yearBounds.min,
              yearMax: yearBounds.max,
              sort: 'dept',
            })
          }
          subjects={facets.subjects}
          courses={facets.courses}
          yearBounds={yearBounds}
        />
      ) : null}
    </View>
  );
}
