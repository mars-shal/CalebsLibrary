// Splash — brand moment on cold start (1.4s).
// Wordmark + living illustration, then routes by state: onboarding when the
// scope is unset, tabs otherwise. The OnboardingGate ignores this route
// (empty segments) so the two never fight.
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { BrandMark } from '@/components/BrandMark';
import { SpotArt } from '@/components/SpotArt';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useOnboarding } from '@/lib/store';

export default function Splash() {
  const c = useThemeColors();
  const router = useRouter();
  const done = useOnboarding((s) => s.done);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const t = setTimeout(() => {
      router.replace(done ? '/(tabs)' : '/onboarding');
    }, 1400);
    return () => clearTimeout(t);
  }, [done, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.paper,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center' }}>
        <SpotArt name="library" size={170} />
        <View style={{ marginTop: 24, transform: [{ scale: 1.35 }] }}>
          <BrandMark />
        </View>
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
  );
}
