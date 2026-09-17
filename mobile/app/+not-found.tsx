// Not found — serif 404 + CTAs (fallen-stack motif lands with real data
// in a later pass; never index into an empty catalogue like the web did).
// The numeral floats gently (reduced-motion gated) — the ambient moment.
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { fonts, spacing } from '@/theme/tokens';
import { SpotArt } from '@/components/SpotArt';
import { useThemeColors } from '@/components/ThemeProvider';
import { useReducedMotion } from '@/motion/motion';

export default function NotFound() {
  const c = useThemeColors();
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    y.value = withRepeat(withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [y, reduceMotion]);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ flex: 1, backgroundColor: c.paper, padding: spacing.gutter, paddingTop: 120, alignItems: 'center' }}>
      <Stack.Screen options={{ title: 'Not found' }} />
      <SpotArt name="link" size={120} />
      <Animated.View style={float}>
        <Text style={{ fontSize: 88, color: c.textPrimary, fontFamily: fonts.serifItalic }}>404</Text>
      </Animated.View>
      <Text style={{ fontSize: 28, color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 8, textAlign: 'center' }}>
        This page wandered off the shelves.
      </Text>
      <Text style={{ fontSize: 15, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 12, marginBottom: 32, textAlign: 'center' }}>
        Whatever you were looking for isn&apos;t here — or isn&apos;t here anymore.
      </Text>
      <Link href="/(tabs)" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to the library"
          style={{ backgroundColor: c.ink100, borderRadius: 6, paddingVertical: 13, paddingHorizontal: 22, minHeight: 52, justifyContent: 'center' }}
        >
          <Text style={{ color: c.paper, fontWeight: '600', fontFamily: fonts.sansSemi }}>Back to the library</Text>
        </Pressable>
      </Link>
      <Link href="/(tabs)/browse" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse everything"
          style={{ marginTop: 12, borderWidth: 1, borderColor: c.ruleStrong, borderRadius: 6, paddingVertical: 13, paddingHorizontal: 22, minHeight: 52, justifyContent: 'center' }}
        >
          <Text style={{ color: c.textPrimary, fontWeight: '500', fontFamily: fonts.sansMedium }}>Browse everything</Text>
        </Pressable>
      </Link>
    </View>
  );
}
