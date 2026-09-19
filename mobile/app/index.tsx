// Splash — the brand moment on cold start.
// The index-card deck lands as ONE aligned stack, then spreads into the
// signature fan; the brand logo (bell + Grotsek wordmark) sits UNDER the
// stack — grounded, no overlay pill. Routes by state: onboarding when the
// scope is unset, tabs otherwise. Tap anywhere to continue instantly.
// Reduced Motion: static spread, timed route.
// The OnboardingGate ignores this route (empty segments) so they never fight.
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { BrandMark } from '@/components/BrandMark';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useOnboarding } from '@/lib/store';
import { useReducedMotion } from '@/motion/motion';

// Final fan geometry (deg, px) — the deck spreads from perfect alignment.
const FAN = [
  { rotate: -9, tx: -26, ty: 3 },
  { rotate: 0, tx: 0, ty: -5 },
  { rotate: 9, tx: 26, ty: 3 },
] as const;

const DECK_DELAY = 420; // let the logo land first
const SPREAD_DURATION = 520;

const ROUTE_AFTER_MS = 1500;

export default function Splash() {
  const c = useThemeColors();
  const router = useRouter();
  const done = useOnboarding((s) => s.done);
  const reduced = useReducedMotion();
  const fired = useRef(false);

  const go = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    router.replace(done ? '/(tabs)' : '/onboarding');
  }, [done, router]);

  useEffect(() => {
    const t = setTimeout(go, ROUTE_AFTER_MS);
    return () => clearTimeout(t);
  }, [go]);

  // One shared clock drives the deck spread so all cards move in phase.
  const spread = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      spread.value = 1;
      return;
    }
    spread.value = withDelay(
      DECK_DELAY,
      withTiming(1, { duration: SPREAD_DURATION, easing: Easing.out(Easing.cubic) }),
    );
  }, [reduced, spread]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue to Bells Notes"
      onPress={go}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: c.bgDefault,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        {/* The card deck: starts perfectly aligned, then spreads to the fan. */}
        <View
          style={{
            width: 150,
            height: 150,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {FAN.map((_, i) => (
            <Card key={i} index={i} spread={spread} reduced={reduced} />
          ))}
        </View>

        {/* Brand wordmark UNDER the stacked notes. */}
        <Animated.View
          entering={reduced ? undefined : FadeIn.delay(560).duration(360)}
          style={{ marginTop: 22 }}
        >
          <View style={{ transform: [{ scale: 1.3 }] }}>
            <BrandMark />
          </View>
        </Animated.View>

        <Animated.View entering={reduced ? undefined : FadeIn.delay(860).duration(300)}>
          <Text
            style={{
              marginTop: 14,
              fontSize: 13,
              color: c.textTertiary,
              fontFamily: fonts.sans,
              letterSpacing: 0.4,
            }}
          >
            Free. Open. No account needed.
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const CARD_W = 104;
const CARD_H = 128;

function Card({
  index,
  spread,
  reduced,
}: {
  index: number;
  spread: SharedValue<number>;
  reduced: boolean;
}) {
  const c = useThemeColors();
  const target = FAN[index];
  const style = useAnimatedStyle(() => {
    const s = spread.value;
    return {
      transform: [
        { rotate: `${target.rotate * s}deg` },
        { translateX: target.tx * s },
        { translateY: target.ty * s },
      ],
    };
  });

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.delay(index * 90).duration(300).easing(Easing.out(Easing.cubic))}
      style={[
        {
          position: 'absolute',
          width: CARD_W,
          height: CARD_H,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: c.borderStrong,
          backgroundColor: c.bgElevated,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
        },
        style,
      ]}
    >
      {index === FAN.length - 1 ? (
        <View style={{ position: 'absolute', left: 14, right: 18, bottom: 16, gap: 7 }}>
          <View style={{ height: 1, backgroundColor: c.borderStrong }} />
          <View style={{ height: 1, backgroundColor: c.borderStrong }} />
          <View style={{ height: 1, backgroundColor: c.borderStrong }} />
        </View>
      ) : null}
    </Animated.View>
  );
}
