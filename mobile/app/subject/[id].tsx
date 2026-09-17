// Subject — department page (port of SubjectView, course-loop bug fixed).
// Hero stats, essentials-4, course rows → course/[id] (web re-pushed the
// same subject), infinite all-papers, top contributors from loaded scope.
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useFacets, useOverlaidPapers, useSearchPages } from '@/lib/queries';
import { type Paper } from '@shared/design';
import { PaperCard } from '@/components/PaperCard';
import { SpotArt } from '@/components/SpotArt';
import { Avatar } from '@/components/Avatar';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/states';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';

export default function Subject() {
  const c = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const facets = useFacets();
  const { results, status, loadMore } = useSearchPages();

  const subject = facets?.subjects.find((s) => s.id === id);
  const courses = useMemo(
    () => facets?.courses.filter((x) => x.subjectId === id) ?? [],
    [facets, id],
  );
  const papersBase = useMemo(
    () => (results as Paper[]).filter((p) => p.subject === id),
    [results, id],
  );
  const papers = useOverlaidPapers(papersBase);
  const essentials = papers.slice(0, 4);

  const contributors = useMemo(() => {
    const counts = new Map<string, { name: string; n: number }>();
    for (const p of papers) {
      const e = counts.get(p.contributor);
      if (e) e.n += 1;
      else counts.set(p.contributor, { name: p.contributorName, n: 1 });
    }
    return [...counts.entries()]
      .map(([cid, v]) => ({ id: cid, ...v }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8);
  }, [papers]);

  const loading = !facets && status === 'LoadingFirstPage';

  if (!loading && !subject) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper, padding: spacing.gutter, paddingTop: 96 }}>
        <EmptyState
          title="Department not found."
          icon="books"
          art="shelf"
          ctaLabel="Browse the library"
          onCta={() => router.navigate('/(tabs)/browse')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.paper }}
      contentContainerStyle={{ paddingBottom: 120 }}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 600) loadMore(50);
      }}
      scrollEventThrottle={400}
    >
      <View style={{ backgroundColor: c.paper2, borderBottomWidth: 1, borderBottomColor: c.rule, paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <SpotArt name="scroll" size={104} />
        </View>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 10 }}>
          Department
        </Text>
        <Text style={{ fontSize: 40, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
          {subject?.name ?? '…'}
        </Text>
        <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 12 }}>
          {(subject?.count ?? 0).toLocaleString()} Papers · {contributors.length} Contributors · {courses.length} Courses
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.gutter, marginTop: 32 }}>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
          This term
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 20 }}>
          This term&apos;s essentials
        </Text>
        {loading ? (
          <View style={{ flexDirection: 'row', gap: 20 }}>
            {[0, 1].map((i) => (
              <SkeletonCard key={i} coverWidth={132} />
            ))}
          </View>
        ) : (
          <FlashList
            horizontal
            data={essentials}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 24 }} />}
            renderItem={({ item, index }) => (
              <View style={{ width: 132 }}>
                <PaperCard paper={item} size="md" index={index} onPress={() => router.push(`/paper/${item.id}`)} />
              </View>
            )}
          />
        )}
      </View>

      <View style={{ paddingHorizontal: spacing.gutter, marginTop: 40 }}>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
          Course list
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 16 }}>
          Every course, every paper
        </Text>
        {courses.map((x) => (
          <Pressable
            key={x.id}
            onPress={() => router.push(`/course/${x.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${x.displayName}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: c.rule,
              borderRadius: 8,
              backgroundColor: c.elevated,
              marginBottom: 10,
              minHeight: 56,
            }}
          >
            <View style={{ width: 3, height: 28, backgroundColor: c.ink100, borderRadius: 2 }} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              {x.displayName}
            </Text>
            <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>{x.paperCount}</Text>
            <Icon name="chevron" size={14} color={c.textQuiet} />
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 40 }}>
        <Text style={{ paddingHorizontal: spacing.gutter, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
          The whole shelf
        </Text>
        <Text style={{ paddingHorizontal: spacing.gutter, fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 16 }}>
          All papers
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.gutter - 8 }}>
          {papers.map((p) => (
            <View key={p.id} style={{ width: '33.333%', padding: 8 }}>
              <PaperCard paper={p} size="sm" onPress={() => router.push(`/paper/${p.id}`)} />
            </View>
          ))}
        </View>
      </View>

      {contributors.length > 0 ? (
        <View style={{ paddingHorizontal: spacing.gutter, marginTop: 40 }}>
          <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
            Regulars
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 16 }}>
            Top contributors
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {contributors.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => router.push(`/profile/${u.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${u.name}'s profile`}
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: c.rule,
                  borderRadius: 8,
                  backgroundColor: c.elevated,
                  gap: 8,
                }}
              >
                <Avatar name={u.name} size={44} />
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                  {u.name}
                </Text>
                <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
                  {u.n} contribution{u.n === 1 ? '' : 's'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
