// Saved — personal library (port of web bookmarks).
// MMKV bookmark ids hydrated via getByIds; unsave inline. Cached-download
// status arrives with the Downloads manager (Phase 4); rows show paper meta.
import { Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import { useBookmarks } from '@/lib/store';
import { getRecents } from '@/lib/recents';
import { cachePapers, getCachedPaper } from '@/lib/cache';
import { useOverlaidPapers } from '@/lib/queries';
import type { Paper } from '@shared/design';
import { IndexStack } from '@/components/IndexStack';
import { EmptyState } from '@/components/states';
import { SkeletonRow } from '@/components/Skeleton';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useDockScrollWiring } from '@/motion/dockScroll';

const DockFlatList = Animated.FlatList;

export default function Saved() {
  const c = useThemeColors();
  const router = useRouter();
  const ids = useBookmarks((s) => s.ids);
  const toggle = useBookmarks((s) => s.toggle);
  const clear = useBookmarks((s) => s.clear);
  const papers = useQuery(
    api.catalogue.getByIds,
    ids.length ? { ids: ids.slice(0, 100) } : 'skip',
  ) as Paper[] | undefined;
  const dockWire = useDockScrollWiring('saved');

  useEffect(() => {
    if (papers?.length) cachePapers(papers);
  }, [papers]);

  // Offline titles: live rows win, cached rows fill gaps (saved ids persist).
  const orderedBase = ids.flatMap((pid) => {
    const live = papers?.find((p) => p.id === pid);
    if (live) return [live];
    const cached = getCachedPaper(pid);
    return cached ? [cached] : [];
  });
  const ordered = useOverlaidPapers(orderedBase);
  const seenIds = new Set(getRecents().map((r) => r.id));

  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 12 }}>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
          Your shelf
        </Text>
        <Text style={{ fontSize: 34, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
          Saved papers
        </Text>
        {ids.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
            <Text style={{ flex: 1, fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>
              {ids.length} saved · downloads live in each paper
            </Text>
            <HapticPressable
              onPress={() => router.push('/downloads')}
              accessibilityRole="button"
              accessibilityLabel="Manage downloads"
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, color: c.textPrimary, fontFamily: fonts.sansMedium }}>Downloads</Text>
            </HapticPressable>
            <HapticPressable
              onPress={clear}
              accessibilityRole="button"
              accessibilityLabel="Clear all saved papers"
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>Clear all</Text>
            </HapticPressable>
          </View>
        ) : null}
      </View>

      {!ids.length ? (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <EmptyState
            title="Nothing saved yet."
            sub="Tap Save on any paper and it lands here — even offline."
            icon="bookmark"
            art="box"
            ctaLabel="Browse the library"
            onCta={() => router.navigate('/(tabs)/browse')}
          />
        </View>
      ) : papers === undefined && !ordered.length ? (
        // Hydrating with a cold cache — skeleton rows, never a blank shelf
        // (and never a false "nothing saved yet" while ids exist).
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <SkeletonRow count={5} />
        </View>
      ) : (
        <DockFlatList
          data={ordered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 140 }}
          onScroll={dockWire.onScroll}
          scrollEventThrottle={dockWire.scrollEventThrottle}
          renderItem={({ item: p }) => (
            <View
              style={{
                flexDirection: 'row',
                gap: 16,
                paddingVertical: 16,
                paddingHorizontal: spacing.gutter,
                borderBottomWidth: 1,
                borderBottomColor: c.borderDefault,
                alignItems: 'flex-start',
              }}
            >
              <HapticPressable
                onPress={() => router.push(`/paper/${p.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${p.title}`}
              >
                <IndexStack paper={p} size="xs" />
              </HapticPressable>
              <HapticPressable
                onPress={() => router.push(`/paper/${p.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${p.title}`}
                style={{ flex: 1, minWidth: 0 }}
              >
                <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                  {p.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {!seenIds.has(p.id) ? (
                    <View accessibilityLabel="Unopened" style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.textSecondary }} />
                  ) : null}
                  <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.mono }}>
                    {p.type} · {p.year}
                  </Text>
                </View>
              </HapticPressable>
              <HapticPressable
                onPress={() => toggle(p.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${p.title} from saved`}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="bookmark" size={18} color={c.textPrimary} />
              </HapticPressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
