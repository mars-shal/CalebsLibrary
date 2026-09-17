// Downloads — storage manager (PRD §5.7).
// 300MB cap bar, per-file open/pin/delete, clear-all. Prefetch automation
// lands with the Phase 6 background job — no decorative toggles here.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import {
  DOWNLOADS_CAP,
  clearCache,
  deletePaper,
  fileFor,
  getPrefetchEnabled,
  setPrefetchEnabled,
  storageUsed,
  togglePin,
  touchOpened,
  useDownloads,
  type DownloadEntry,
} from '@/lib/downloads';
import type { Paper } from '@shared/design';
import { Icon } from '@/icons/icons';
import { EmptyState } from '@/components/states';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { toast } from '@/components/Toast';
import { track } from '@/lib/analytics';
import { isOnlineNow } from '@/lib/net';
import { touchRecent } from '@/lib/recents';

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Downloads() {
  const c = useThemeColors();
  const router = useRouter();
  const entries = useDownloads((s) => s.entries);
  const refresh = useDownloads((s) => s.refresh);
  const [prefetch, setPrefetch] = useState(getPrefetchEnabled());
  const list = Object.values(entries)
    .filter((e) => e.complete)
    .sort((a, b) => b.openedAt - a.openedAt);
  const titles = useQuery(
    api.catalogue.getByIds,
    list.length ? { ids: list.map((e) => e.id).slice(0, 100) } : 'skip',
  ) as Paper[] | undefined;
  const titleOf = (id: string) => titles?.find((p) => p.id === id)?.title ?? id;

  const used = storageUsed();
  const pct = Math.min(100, Math.round((used / DOWNLOADS_CAP) * 100));

  const open = async (e: DownloadEntry) => {
    try {
      const f = fileFor(e.id, e.ext);
      if (!f.exists) {
        toast('File missing — re-download from the paper');
        return;
      }
    touchOpened(e.id);
    touchRecent(e.id);
    refresh();
    try {
      if (!(await isOnlineNow())) track('offline_open', { paperId: e.id });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(f.uri, { dialogTitle: titleOf(e.id) });
      } else {
        toast('No viewer available on this device');
      }
    } catch {
      // Sharing failed — fall through to outer handler
      throw new Error('Could not open the file');
    }
  } catch {
    toast('Could not open the file');
  }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.paper }} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: 64 }}>
        <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
          Offline
        </Text>
        <Text style={{ fontSize: 34, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
          Downloads
        </Text>

        <View style={{ marginTop: 20, padding: 16, borderWidth: 1, borderColor: c.rule, borderRadius: 8, backgroundColor: c.elevated }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>Storage used</Text>
            <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.mono }}>
              {formatMB(used)} / {formatMB(DOWNLOADS_CAP)}
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.rule, overflow: 'hidden' }}>
            <View style={{ width: `${pct}%`, height: 6, backgroundColor: c.ink100 }} />
          </View>
          <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 10 }}>
            Oldest unpinned files auto-evict past the cap. Pinned files never evict.
          </Text>
          <Pressable
            onPress={() => {
              const next = !prefetch;
              setPrefetchEnabled(next);
              setPrefetch(next);
              toast(next ? 'Wifi prefetch on' : 'Wifi prefetch off');
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: prefetch }}
            accessibilityLabel="Wifi-only prefetch of recent papers"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, minHeight: 48 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: prefetch ? c.ink100 : c.ruleStrong,
                backgroundColor: prefetch ? c.ink100 : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {prefetch ? <Text style={{ color: c.paper, fontSize: 13, fontWeight: '700' }}>✓</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                Prefetch on wifi
              </Text>
              <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans }}>
                Top recent papers land on disk silently
              </Text>
            </View>
          </Pressable>
        </View>

        {list.length === 0 ? (
          <View style={{ marginTop: 24 }}>
            <EmptyState
              title="No downloads yet."
              sub="Download a paper to read it offline — even in airplane mode."
              icon="download"
              art="tray"
              ctaLabel="Browse the library"
              onCta={() => router.navigate('/(tabs)/browse')}
            />
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            {list.map((e) => (
              <View
                key={e.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: c.rule,
                }}
              >
                <Pressable
                  onPress={() => router.push(`/paper/${e.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${titleOf(e.id)}`}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                    {titleOf(e.id)}
                  </Text>
                  <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 4 }}>
                    {formatMB(e.size)}{e.pinned ? ' · PINNED' : ''}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void open(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${titleOf(e.id)} file`}
                  style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="file" size={18} color={c.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    togglePin(e.id);
                    refresh();
                    toast(e.pinned ? 'Unpinned' : 'Pinned — never auto-evicts');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={e.pinned ? 'Unpin file' : 'Pin file'}
                  style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name={e.pinned ? 'bookmark' : 'plus'} size={18} color={e.pinned ? c.textPrimary : c.textTertiary} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    void deletePaper(e.id).then(() => {
                      refresh();
                      toast('Deleted');
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${titleOf(e.id)} download`}
                  style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="x" size={16} color={c.textTertiary} />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => {
                void clearCache().then(() => {
                  refresh();
                  toast('Cache cleared');
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear all downloads"
              style={{ alignItems: 'center', paddingVertical: 16, minHeight: 52, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, color: c.error, fontFamily: fonts.sansMedium }}>Clear all downloads</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
