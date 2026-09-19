// Profile — public contributor page (port of ProfileView, mocks removed).
// Papers + About tabs only (Shelves hidden until real collections land).
// Reads are REAL metric sums over loaded scope; contributor-since derives
// from the earliest loaded paper. Unknown ids → Community fallback card.
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMetrics, useSearchPages } from '@/lib/queries';
import { FOUNDER_EMAIL } from '@shared/catalogue';
import { FALLBACK_CONTRIBUTOR, initialsOf, type Paper } from '@shared/design';
import { PaperCard } from '@/components/PaperCard';
import { Segmented } from '@/components/Segmented';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/states';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';

export default function Profile() {
  const c = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { results, status } = useSearchPages();
  const [tab, setTab] = useState<'papers' | 'about'>('papers');

  const papers = useMemo(
    () => (results as Paper[]).filter((p) => p.contributor === id),
    [results, id],
  );
  const ids = useMemo(() => papers.map((p) => p.id).slice(0, 100), [papers]);
  const metrics = useMetrics(ids);
  const reads = (metrics ?? []).reduce((n, m) => n + m.reads, 0);
  const sinceYear = useMemo(() => {
    if (!papers.length) return null;
    const years = papers.map((p) => p.year).filter((y) => Number.isFinite(y));
    return years.length ? Math.min(...years) : null;
  }, [papers]);

  const loading = status === 'LoadingFirstPage';
  const isFounder = id === FOUNDER_EMAIL;
  // Reputation seals — earned, never bought: volume + reach thresholds.
  const seals: string[] = [
    ...(isFounder ? ['Founder'] : []),
    ...(papers.length >= 20 ? ['Prolific'] : papers.length >= 10 ? ['Regular'] : []),
    ...(reads >= 5000 ? ['Widely read'] : reads >= 1000 ? ['On the rise'] : []),
  ];
  const name = papers[0]?.contributorName ?? (isFounder ? 'Caleb' : FALLBACK_CONTRIBUTOR.name);
  const handle = isFounder ? '@caleb' : id?.includes('@') ? `@${id.split('@')[0]}` : `@${id}`;
  const known = papers.length > 0 || isFounder;

  if (!loading && !known) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDefault, padding: spacing.gutter, paddingTop: 96 }}>
        <EmptyState
          title="Community contributor"
          sub="No papers from this contributor in your scope yet."
          icon="user"
          ctaLabel="Browse the library"
          onCta={() => router.navigate('/(tabs)/browse')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bgDefault }} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={{ backgroundColor: c.bgDefault, borderBottomWidth: 1, borderBottomColor: c.borderDefault, paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 32 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.textPrimary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Text style={{ color: c.bgDefault, fontSize: 40, fontWeight: '500', fontFamily: fonts.sansMedium }}>
            {initialsOf(name)}
          </Text>
        </View>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
          Contributor{isFounder ? ' · Founder' : ''}
        </Text>
        <Text style={{ fontSize: 40, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
          {name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 11, backgroundColor: c.bgSkeleton, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, color: c.textSecondary, fontFamily: fonts.sansMedium }}>
            {handle}
          </Text>
          {seals.map((s) => (
            <Text key={s} style={{ fontSize: 11, backgroundColor: c.textPrimary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, color: c.bgDefault, fontFamily: fonts.sansMedium }}>
              {s}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 40, marginTop: 20 }}>
          <View>
            <Text style={{ fontSize: 28, color: c.textPrimary, fontFamily: fonts.sansMedium }}>{papers.length}</Text>
            <Text style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.7, color: c.textTertiary, fontFamily: fonts.sansSemi, marginTop: 4 }}>
              Contributions
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 28, color: c.textPrimary, fontFamily: fonts.sansMedium }}>{reads.toLocaleString()}</Text>
            <Text style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.7, color: c.textTertiary, fontFamily: fonts.sansSemi, marginTop: 4 }}>
              Reads
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.gutter, marginTop: 24 }}>
        <Segmented
          accessibilityLabel="Profile sections"
          value={tab}
          onChange={setTab}
          options={[
            { id: 'papers', label: `Papers (${papers.length})` },
            { id: 'about', label: 'About' },
          ]}
        />
      </View>

      {tab === 'papers' ? (
        <View style={{ paddingHorizontal: spacing.gutter, marginTop: 24 }}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 20 }}>
              {[0, 1].map((i) => (
                <SkeletonCard key={i} coverWidth={132} />
              ))}
            </View>
          ) : papers.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -12 }}>
              {papers.map((p) => (
                <View key={p.id} style={{ width: '50%', padding: 12 }}>
                  <PaperCard paper={p} size="md" onPress={() => router.push(`/paper/${p.id}`)} />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No papers in scope yet."
              sub="Their shelves may live at another level."
              icon="books"
              art="box"
            />
          )}
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing.gutter, marginTop: 24 }}>
          <View style={{ padding: 24, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.borderDefault, borderRadius: 8 }}>
            <Text style={{ fontSize: 15, lineHeight: 26, color: c.textPrimary, fontFamily: fonts.sans }}>
              {isFounder
                ? 'Started this library in a shared folder, 2019.'
                : `Contributes across ${papers.length} paper${papers.length === 1 ? '' : 's'} in the library.`}
              {sinceYear ? `\n\nContributor since ${sinceYear}. Uploads mostly at the end of each semester, when whatever carried them through gets passed forward.` : ''}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
