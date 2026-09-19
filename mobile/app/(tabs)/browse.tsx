// Browse — College→Program→Level drill-down. NOT subject-first shelves.
// Hierarchy + counts come from `facets` (server truth); the paper list is
// server-filtered via `useScopedPages` overrides so paging covers the whole
// selection (the first version built the tree from page 1 and hid the rest).
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Animated, { createAnimatedComponent } from 'react-native-reanimated';
import { useFacets, useOverlaidPapers, useScopedPages } from '@/lib/queries';
import { type Paper } from '@shared/design';
import { IndexStack } from '@/components/IndexStack';
import { EmptyState, OfflineBadge } from '@/components/states';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useNet } from '@/lib/net';
import { useDockScrollWiring } from '@/motion/dockScroll';

const DockScrollView = Animated.ScrollView;
// Typed alias: createAnimatedComponent erases FlashList's generic param.
const DockFlashList = createAnimatedComponent(FlashList) as unknown as typeof FlashList;

const LEVEL_LABEL: Record<string, string> = {
  '1': '100 Level',
  '2': '200 Level',
  '3': '300 Level',
  '4': '400 Level',
  '5': '500 Level',
};

export default function Browse() {
  const c = useThemeColors();
  const router = useRouter();
  const { online } = useNet();
  const dockWire = useDockScrollWiring('browse');

  // Drill-down state ('all' = not constrained at this tier)
  const [college, setCollege] = useState<string>('all');
  const [program, setProgram] = useState<string>('all');
  const [level, setLevel] = useState<string>('all');

  // Whole-library facets: the college grid must list every college. The
  // scoped facets call hid all but the user's own college with no hint.
  const facets = useFacets({ global: true });

  // Server-filtered, paginated list for the CURRENT selection.
  const { results, status, loadMore, isLoading } = useScopedPages({
    college,
    levelYear: level,
    program,
  });
  const papers = useOverlaidPapers(results as Paper[]);

  const colleges = useMemo(() => facets?.colleges ?? [], [facets]);
  const programs = useMemo(
    () => colleges.find((x) => x.name === college)?.programs ?? [],
    [colleges, college],
  );
  const levels = useMemo(
    () => programs.find((x) => x.name === program)?.levels ?? [],
    [programs, program],
  );

  const loadingFirst = status === 'LoadingFirstPage' && papers.length === 0;
  const canLoadMore = status === 'CanLoadMore';
  // totalPapers counts the whole scoped catalogue; when unscoped beyond the
  // current selection the header shows the selection's server total instead.
  const selectedCount = useMemo(() => {
    if (college === 'all') return facets?.totalPapers ?? papers.length;
    const col = colleges.find((x) => x.name === college);
    if (!col) return facets?.totalPapers ?? papers.length;
    if (program === 'all') return col.paperCount;
    const prog = col.programs.find((x) => x.name === program);
    if (!prog) return col.paperCount;
    if (level === 'all') return prog.paperCount;
    return prog.levels.find((l) => l.key === level)?.count ?? 0;
  }, [facets, colleges, college, program, level, papers.length]);

  const goBack = () => {
    if (level !== 'all') setLevel('all');
    else if (program !== 'all') setProgram('all');
    else if (college !== 'all') setCollege('all');
  };

  const breadcrumb = useMemo(() => {
    const crumbs: { label: string; action?: () => void }[] = [];
    if (college !== 'all')
      crumbs.push({
        label: college,
        action: () => {
          setCollege('all');
          setProgram('all');
          setLevel('all');
        },
      });
    if (program !== 'all')
      crumbs.push({
        label: program,
        action: () => {
          setProgram('all');
          setLevel('all');
        },
      });
    if (level !== 'all') crumbs.push({ label: LEVEL_LABEL[level] ?? level });
    return crumbs;
  }, [college, program, level]);

  const header = (title: string) => (
    <View style={{ paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 12 }}>
      {college !== 'all' ? (
        <HapticPressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, marginBottom: 8 }}
        >
          <Icon name="arrow-left" size={16} color={c.textSecondary} />
          <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans }}>Back</Text>
        </HapticPressable>
      ) : null}
      {breadcrumb.length ? (
        <Breadcrumb
          items={breadcrumb}
          onReset={() => {
            setCollege('all');
            setProgram('all');
            setLevel('all');
          }}
        />
      ) : null}
      <Text style={{ fontSize: 28, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi, marginTop: 12, marginBottom: 4 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
          {selectedCount.toLocaleString()} papers
        </Text>
        {!online ? <OfflineBadge /> : null}
      </View>
    </View>
  );

  // ─── Level picker ───
  if (college !== 'all' && program !== 'all' && level === 'all') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
        {header('Pick a level')}
        <DockScrollView contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: 140 }} onScroll={dockWire.onScroll} scrollEventThrottle={dockWire.scrollEventThrottle}>
          {levels.length === 0 ? (
            <View style={{ marginTop: 32 }}>
              <EmptyState title="No papers in this program" sub="Try another program or college." icon="books" />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {levels.map((l) => (
                <HapticPressable
                  key={l.key}
                  onPress={() => setLevel(l.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${LEVEL_LABEL[l.key] ?? l.key} — ${l.count} papers`}
                  style={{
                    width: '48%',
                    padding: 20,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: c.borderDefault,
                    backgroundColor: c.bgElevated,
                    minHeight: 76,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 28, fontWeight: '700', color: c.textPrimary, fontFamily: fonts.mono }}>
                    {LEVEL_LABEL[l.key] ?? l.key}
                  </Text>
                  <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 4 }}>
                    {l.count} papers
                  </Text>
                </HapticPressable>
              ))}
            </View>
          )}
        </DockScrollView>
      </View>
    );
  }

  // ─── Program picker ───
  if (college !== 'all' && program === 'all') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
        {header('Programs')}
        <DockScrollView contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: 140 }} onScroll={dockWire.onScroll} scrollEventThrottle={dockWire.scrollEventThrottle}>
          {programs.length === 0 ? (
            <View style={{ marginTop: 32 }}>
              <EmptyState title="No papers in this college yet" sub="Try another college." icon="books" />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {programs.map((prog) => (
                <HapticPressable
                  key={prog.name}
                  onPress={() => setProgram(prog.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`${prog.name} — ${prog.paperCount} papers`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 18,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: c.borderDefault,
                    backgroundColor: c.bgElevated,
                    minHeight: 64,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
                      {prog.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>
                      {prog.paperCount} papers · {prog.levels.length} levels
                    </Text>
                  </View>
                  <Icon name="chevron" size={16} color={c.textTertiary} />
                </HapticPressable>
              ))}
            </View>
          )}
        </DockScrollView>
      </View>
    );
  }

  // ─── College grid (default) or papers list ───
  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
      {header(college !== 'all' ? (level !== 'all' ? LEVEL_LABEL[level] ?? level : 'All papers') : 'Browse')}

      {loadingFirst || (college === 'all' && !facets) ? (
        <View style={{ paddingHorizontal: spacing.gutter, gap: 12, marginTop: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ height: 64, borderRadius: 12, backgroundColor: c.bgSkeleton }} />
          ))}
        </View>
      ) : college === 'all' ? (
        <DockScrollView contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: 140 }} onScroll={dockWire.onScroll} scrollEventThrottle={dockWire.scrollEventThrottle}>
          {colleges.length === 0 ? (
            <View style={{ marginTop: 32 }}>
              <EmptyState
                title="Nothing in your scope yet"
                sub="Widen your study scope in Settings to see the whole library."
                icon="books"
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {colleges.map((col) => (
                <HapticPressable
                  key={col.name}
                  onPress={() => setCollege(col.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`${col.name} — ${col.paperCount} papers`}
                  style={{
                    width: '48%',
                    padding: 20,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: c.borderDefault,
                    backgroundColor: c.bgElevated,
                    minHeight: 80,
                    justifyContent: 'center',
                  }}
                >
                  <Text numberOfLines={2} style={{ fontSize: 17, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
                    {col.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 4 }}>
                    {col.paperCount} papers · {col.programs.length} programs
                  </Text>
                </HapticPressable>
              ))}
            </View>
          )}
        </DockScrollView>
      ) : papers.length > 0 || canLoadMore || isLoading ? (
        <DockFlashList
          data={papers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: 140, paddingTop: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          onScroll={dockWire.onScroll}
          scrollEventThrottle={dockWire.scrollEventThrottle}
          onEndReached={() => {
            if (canLoadMore) loadMore(50);
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <HapticPressable
              onPress={() => router.push(`/paper/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}, ${item.type}, ${item.year}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderRadius: 10 }}
            >
              {/* Art only — the row is the single interactive element, so the
                  web DOM never nests a button inside a button. */}
              <IndexStack paper={item} size="xs" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 4 }}>
                  {item.type} · {item.year}{' '}
                  {item.type === 'course' ? 'Course' : 'course' in item && item.course ? item.course : ''}
                </Text>
              </View>
            </HapticPressable>
          )}
          ListFooterComponent={
            canLoadMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.bgSkeleton }} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={{ paddingHorizontal: spacing.gutter, marginTop: 32 }}>
          <EmptyState title="No papers here" sub="Try a different level or program." icon="books" />
        </View>
      )}
    </View>
  );
}

function Breadcrumb({ items, onReset }: { items: { label: string; action?: () => void }[]; onReset: () => void }) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
      <HapticPressable onPress={onReset} accessibilityRole="button" accessibilityLabel="Reset to all" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>All</Text>
      </HapticPressable>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="chevron" size={12} color={c.textQuiet} />
          {item.action ? (
            <HapticPressable onPress={item.action} accessibilityRole="button" accessibilityLabel={`Filter by ${item.label}`} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>{item.label}</Text>
            </HapticPressable>
          ) : (
            <Text style={{ fontSize: 13, color: c.textPrimary, fontFamily: fonts.sans }}>{item.label}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
