// Saved — personal library (port of web bookmarks).
// MMKV bookmark ids hydrated via getByIds; unsave inline. Cached-download
// status arrives with the Downloads manager (Phase 4); rows show paper meta.
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import { useBookmarks } from '@/lib/store';
import { getRecents } from '@/lib/recents';
import { cachePapers, getCachedPaper } from '@/lib/cache';
import { useOverlaidPapers } from '@/lib/queries';
import type { Paper } from '@shared/design';
import { BookCover } from '@/components/BookCover';
import { EmptyState } from '@/components/states';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';

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
    <View style={{ flex: 1, backgroundColor: c.paper }}>
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
            <Pressable
              onPress={() => router.push('/downloads')}
              accessibilityRole="button"
              accessibilityLabel="Manage downloads"
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, color: c.textPrimary, fontFamily: fonts.sansMedium }}>Downloads</Text>
            </Pressable>
            <Pressable
              onPress={clear}
              accessibilityRole="button"
              accessibilityLabel="Clear all saved papers"
              style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>Clear all</Text>
            </Pressable>
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
      ) : (
        <FlatList
          data={ordered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 140 }}
          renderItem={({ item: p }) => (
            <View
              style={{
                flexDirection: 'row',
                gap: 16,
                paddingVertical: 16,
                paddingHorizontal: spacing.gutter,
                borderBottomWidth: 1,
                borderBottomColor: c.rule,
                alignItems: 'flex-start',
              }}
            >
              <Pressable
                onPress={() => router.push(`/paper/${p.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${p.title}`}
              >
                <BookCover paper={p} size="xs" />
              </Pressable>
              <Pressable
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
              </Pressable>
              <Pressable
                onPress={() => toggle(p.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${p.title} from saved`}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="bookmark" size={18} color={c.textPrimary} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
