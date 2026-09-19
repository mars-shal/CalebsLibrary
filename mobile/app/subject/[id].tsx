// Subject — department page (port of SubjectView, course-loop bug fixed).
// Hero stats, essentials-4, course rows → course/[id] (web re-pushed the
// same subject), infinite all-papers, top contributors from loaded scope.
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import {
  useFacets,
  useOverlaidPapers,
  useScopedContributors,
  useScopedCount,
  useSubjectPapers,
} from '@/lib/queries';
import { type Paper } from '@shared/design';
import { PaperCard } from '@/components/PaperCard';
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
  // Server-side scope+subject filtering — header stats, lists, and
  // contributors now all describe the same set (client-side page filtering
  // rendered facet counts next to empty lists for out-of-page subjects).
  const {
    results,
    status,
    loadMore,
  } = useSubjectPapers(id);
  const totalCount = useScopedCount({ subject: id });
  const contributorRows = useScopedContributors({ subject: id });

  const subject = facets?.subjects.find((s) => s.id === id);
  const courses = useMemo(
    () => facets?.courses.filter((x) => x.subjectId === id) ?? [],
    [facets, id],
  );
  const papers = useOverlaidPapers(results as Paper[]);
  const essentials = papers.slice(0, 4);

  const contributors = contributorRows ?? [];

  const loading = !facets && status === 'LoadingFirstPage';

  if (!loading && !subject) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDefault, padding: spacing.gutter, paddingTop: 96 }}>
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
      style={{ flex: 1, backgroundColor: c.bgDefault }}
      contentContainerStyle={{ paddingBottom: 120 }}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 600) loadMore(50);
      }}
      scrollEventThrottle={400}
    >
      <View style={{ backgroundColor: c.bgDefault, borderBottomWidth: 1, borderBottomColor: c.borderDefault, paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 32 }}>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 10 }}>
          Department
        </Text>
        <Text style={{ fontSize: 40, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
          {subject?.name ?? '…'}
        </Text>
        <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 12 }}>
          {(totalCount ?? subject?.count ?? 0).toLocaleString()} Papers · {contributors.length} Contributors · {courses.length} Courses
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
          <HapticPressable
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
              borderColor: c.borderDefault,
              borderRadius: 8,
              backgroundColor: c.bgElevated,
              marginBottom: 10,
              minHeight: 56,
            }}
          >
            <View style={{ width: 3, height: 28, backgroundColor: c.textPrimary, borderRadius: 2 }} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              {x.displayName}
            </Text>
            <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>{x.paperCount}</Text>
            <Icon name="chevron" size={14} color={c.textQuiet} />
          </HapticPressable>
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
              <HapticPressable
                key={u.id}
                onPress={() => router.push(`/profile/${u.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${u.name}'s profile`}
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: c.borderDefault,
                  borderRadius: 8,
                  backgroundColor: c.bgElevated,
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
              </HapticPressable>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
