// Short-link resolver — /s/:code (port of ShortLinkView).
// bumpClicks fires and forgets; getByCode resolves to a paper screen for
// catalogue links or the system browser for external URLs. Missing codes
// get the missing card (never a silent redirect).
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvex, useMutation } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { api } from '@/lib/convex';
import { EmptyState } from '@/components/states';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';

export default function ShortLink() {
  const c = useThemeColors();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const convex = useConvex();
  const bump = useMutation(api.shortLink.bumpClicks);
  const started = useRef(false);
  const [missing, setMissing] = useState(false);
  const [external, setExternal] = useState<string | null>(null);

  useEffect(() => {
    if (!code || started.current) return;
    started.current = true;
    void bump({ code }).catch(() => {});
    void convex
      .query(api.shortLink.getByCode, { code })
      .then(async (link) => {
        if (!link) {
          setMissing(true);
          return;
        }
        if (link.paper_id) {
          router.replace(`/paper/${link.paper_id}`);
          return;
        }
        setExternal(link.url);
        try {
          await WebBrowser.openBrowserAsync(link.url);
        } catch {
          // user can retry from the card below
        }
      })
      .catch(() => setMissing(true));
  }, [code, bump, convex, router]);

  if (missing) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgDefault, padding: spacing.gutter, paddingTop: 120 }}>
        <EmptyState
          title="That link doesn't look right."
          sub="The short link may be mistyped or no longer exists."
          icon="share"
          art="link"
          ctaLabel="Back to the library"
          onCta={() => router.replace('/(tabs)')}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault, padding: spacing.gutter, paddingTop: 120, alignItems: 'center' }}>
      <HapticPressable onPress={() => router.replace('/(tabs)')} accessibilityRole="button" accessibilityLabel="Go back" style={{ position: 'absolute', top: 64, left: spacing.gutter, minHeight: 44, justifyContent: 'center' }}>
        <Icon name="arrow-left" size={18} color={c.textSecondary} />
      </HapticPressable>
      <ActivityIndicator size="large" color={c.textTertiary} style={{ marginTop: 32 }} />
      <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 24 }}>
        {external ? 'Opened externally.' : 'Opening the library…'}
      </Text>
      <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 12 }}>
        Taking you to your document.
      </Text>
      {external ? (
        <HapticPressable
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Back to the library"
          style={{ marginTop: 28, backgroundColor: c.textPrimary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 22, minHeight: 52, justifyContent: 'center' }}
        >
          <Text style={{ color: c.bgDefault, fontWeight: '600', fontFamily: fonts.sansSemi }}>Back to the library</Text>
        </HapticPressable>
      ) : null}
    </View>
  );
}
