// Celebrate — paper-grain burst overlay for milestones.
// Hosted once at root; fires via the milestones bus. Twelve squares burst
// outward and fade (~1.1s). Reduced-motion: toast only, no burst.
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { onCelebrate } from '../lib/milestones';
import { useReducedMotion } from '../motion/motion';
import { fonts } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { toast } from './Toast';

const BITS = 12;

function Burst({ seed }: { seed: number }) {
  const c = useThemeColors();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [p]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: BITS }, (_, i) => (
        <Bit key={i} index={i} seed={seed} progress={p} color={i % 3 === 0 ? c.textTertiary : c.paper3} />
      ))}
    </View>
  );
}

function Bit({
  index,
  seed,
  progress,
  color,
}: {
  index: number;
  seed: number;
  progress: { value: number };
  color: string;
}) {
  const angle = ((index + seed) / BITS) * Math.PI * 2;
  const dist = 70 + ((index * 37 + seed * 11) % 60);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * dist * progress.value },
      { translateY: Math.sin(angle) * dist * progress.value - 30 * progress.value },
      { rotate: `${progress.value * (index % 2 === 0 ? 120 : -120)}deg` },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));
  const size = 6 + ((index * 13 + seed) % 7);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: 1.5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function CelebrateHost() {
  const reduceMotion = useReducedMotion();
  const [burst, setBurst] = useState<{ message: string; seed: number } | null>(null);

  useEffect(() => {
    return onCelebrate((message) => {
      toast(message);
      if (!reduceMotion) {
        setBurst({ message, seed: Math.floor(Math.random() * 1000) });
        setTimeout(() => setBurst(null), 1300);
      }
    });
  }, [reduceMotion]);

  const c = useThemeColors();
  if (!burst) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 200 }}
    >
      <Burst seed={burst.seed} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 160, alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: c.ink100,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: c.paper, fontSize: 13, fontWeight: '600', fontFamily: fonts.sansSemi }}>
            {burst.message}
          </Text>
        </View>
      </View>
    </View>
  );
}
