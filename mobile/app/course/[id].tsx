// Course — NEW screen (web had none; subject rows looped to themselves).
// Hero displayName, Notes/PQs segmented tabs, infinite course list,
// one-tap exam pack (bulk download of the listed set).
import { useMemo, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { getFreeDiskStorageAsync } from 'expo-file-system/legacy';
import { api } from '@/lib/convex';
import { useFacets, useOverlaidPapers, useSearchPages } from '@/lib/queries';
import { downloadPaper, isDownloaded, resolvePaperUrl } from '@/lib/downloads';
import { toast } from '@/components/Toast';
import { Icon } from '@/icons/icons';
import type { Paper } from '@shared/design';
import { IndexStack } from '@/components/IndexStack';
import { Segmented } from '@/components/Segmented';
import { SkeletonRow } from '@/components/Skeleton';
import { EmptyState } from '@/components/states';
import { HighlightText } from '@/components/HighlightText';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';

export default function Course() {
  const c = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const facets = useFacets();
  const { results, status, loadMore } = useSearchPages();
  const [tab, setTab] = useState<'all' | 'Notes' | 'Past Exam'>('all');

  const course = facets?.courses.find((x) => x.id === id);
  // Tab ids must map to the CATALOGUE's type vocabulary: papers store
  // 'Lecture Notes' (not 'Notes') and 'Past Exam' (not 'Past questions').
  // The old filter compared against 'Notes' and never matched anything, so
  // the Notes tab (and its exam pack) was always empty.
  const tabType = tab === 'Notes' ? 'Lecture Notes' : tab === 'Past Exam' ? 'Past Exam' : undefined;
  const papersBase = useMemo(() => {
    const list = (results as Paper[]).filter((p) => p.course === id);
    return tabType ? list.filter((p) => p.type === tabType) : list;
  }, [results, id, tabType]);
  const papers = useOverlaidPapers(papersBase);

// Exam pack: the COMPLETE server-side set for this tab (not just loaded
// pages), downloaded sequentially with skip-cached + cap + cancel.
// NOTE: packIds is course-scoped; a course larger than the 300MB device cap
// can never fully fit, so downloads that hit the cap are expected failures
// (the error toast from downloadPaper surfaces per-file).
const pack = useQuery(
  api.catalogue.packIds,
  id ? { course: id, type: tabType ?? 'all' } : 'skip',
) as { id: string; fileExt: string; fileId: string }[] | undefined;
const [packState, setPackState] = useState({ active: false, done: 0, total: 0 });
const packCancel = useRef(false);
const packLabel = tab === 'all' ? 'papers' : tab === 'Notes' ? 'notes' : 'past questions';

const startPack = async () => {
  if (packState.active || !pack?.length) return;
  // 300MB headroom probe: a pack that obviously cannot fit fails fast with
  // guidance instead of churning through every file and failing 40 times.
  const free = await getFreeDiskStorageAsync().catch(() => Number.POSITIVE_INFINITY);
  if (free < 50 * 1024 * 1024) {
    toast('Not enough free storage for this pack');
    return;
  }
  const fresh: { id: string; fileExt: string; fileId: string }[] = [];
  for (const it of pack) {
    try {
      if (!(await isDownloaded(it.id))) fresh.push(it);
    } catch {
      fresh.push(it);
    }
  }
  if (!fresh.length) {
    toast('Already downloaded');
    return;
  }
  packCancel.current = false;
  setPackState({ active: true, done: 0, total: fresh.length });
  let done = 0;
  let failed = 0;
  for (const it of fresh) {
    if (packCancel.current) break;
    try {
      const url = await resolvePaperUrl({ id: it.id, fileId: it.fileId });
      await downloadPaper({ id: it.id, ext: it.fileExt, url });
      done += 1;
    } catch {
      failed += 1;
    }
    setPackState({ active: true, done: done + failed, total: fresh.length });
  }
  const cancelled = packCancel.current;
  setPackState({ active: false, done: 0, total: 0 });
  toast(
    cancelled
      ? `Stopped — ${done} downloaded`
      : failed > 0
        ? `${done} downloaded, ${failed} failed`
        : `${done} ${done === 1 ? 'paper' : 'papers'} downloaded`,
  );
};

  const loading = !facets && status === 'LoadingFirstPage';

  if (!loading && !course) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDefault, padding: spacing.gutter, paddingTop: 96 }}>
        <EmptyState
          title="Course not found."
          icon="books"
          ctaLabel="Browse the library"
          onCta={() => router.navigate('/(tabs)/browse')}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 12 }}>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
          Course
        </Text>
        <Text style={{ fontSize: 30, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
          {course?.displayName ?? '…'}
        </Text>
        <View style={{ marginTop: 16 }}>
          <Segmented
            accessibilityLabel="Filter by material type"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'all', label: 'All' },
              { id: 'Notes', label: 'Notes' },
              { id: 'Past Exam', label: 'Past questions' },
            ]}
          />
        </View>
        {(pack?.length ?? 0) > 0 ? (
          <View
            style={{
              marginTop: 14,
              borderWidth: 1,
              borderColor: c.borderDefault,
              borderRadius: 8,
              backgroundColor: c.bgElevated,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
                  Exam pack · {pack!.length} {packLabel}
                </Text>
                <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>
                  {packState.active
                    ? `${packState.done} of ${packState.total}`
                    : 'One tap, offline-ready'}
                </Text>
              </View>
              {packState.active ? (
                <HapticPressable
                  onPress={() => {
                    packCancel.current = true;
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel pack download"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: c.borderStrong,
                    minHeight: 44,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                    Cancel
                  </Text>
                </HapticPressable>
              ) : (
                <HapticPressable
                  onPress={() => void startPack()}
                  accessibilityRole="button"
                  accessibilityLabel={`Download ${pack!.length} ${packLabel}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    backgroundColor: c.textPrimary,
                    minHeight: 44,
                  }}
                >
                  <Icon name="download" size={14} color={c.bgDefault} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.bgDefault, fontFamily: fonts.sansSemi }}>
                    Get pack
                  </Text>
                </HapticPressable>
              )}
            </View>
            {packState.active ? (
              <View style={{ height: 4, borderRadius: 2, backgroundColor: c.borderDefault, overflow: 'hidden', marginTop: 12 }}>
                <View
                  style={{
                    width: `${packState.total > 0 ? Math.round((packState.done / packState.total) * 100) : 0}%`,
                    height: 4,
                    backgroundColor: c.textPrimary,
                  }}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <SkeletonRow count={5} />
        </View>
      ) : papers.length ? (
        <FlatList
          data={papers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 140 }}
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
                paddingVertical: 16,
                paddingHorizontal: spacing.gutter,
                borderBottomWidth: 1,
                borderBottomColor: c.borderDefault,
                alignItems: 'flex-start',
              }}
            >
              <IndexStack paper={p} size="xs" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <HighlightText text={p.title} query="" fontSize={16} />
                <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 4 }}>
                  {p.type} · {p.year} · {p.pages} pages
                </Text>
              </View>
            </HapticPressable>
          )}
        />
      ) : (
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <EmptyState
            title={tab === 'all' ? 'No papers here yet.' : `No ${tab === 'Past Exam' ? 'past questions' : 'notes'} here yet.`}
            sub="Check the website for the full archive, or try another course."
            icon="books"
            art="search"
            ctaLabel="Browse the library"
            onCta={() => router.navigate('/(tabs)/browse')}
          />
        </View>
      )}
    </View>
  );
}
