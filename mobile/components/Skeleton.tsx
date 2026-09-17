// Skeleton — shimmer placeholders while lists load.
// Port of SkeletonCard shimmer (paper-3 base + travelling highlight).
import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from './ThemeProvider';
import { useReducedMotion } from '../motion/motion';

function ShimmerBlock({ width, height, radius = 4 }: { width: DimensionValue; height: number; radius?: number }) {
  const c = useThemeColors();
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(-1);
  useEffect(() => {
    if (reduceMotion) return;
    x.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [x, reduceMotion]);
  const highlight = useAnimatedStyle(() => ({
    opacity: 0.25 + 0.2 * (1 - Math.abs(x.value)),
  }));
  return (
    <View style={{ width, height, borderRadius: radius, backgroundColor: c.paper3, overflow: 'hidden' }}>
      <Animated.View style={[{ flex: 1, backgroundColor: '#ffffff' }, highlight]} />
    </View>
  );
}

export function SkeletonCard({ coverWidth = 132 }: { coverWidth?: number }) {
  return (
    <View style={{ flexDirection: 'column', gap: 12, width: coverWidth }}>
      <ShimmerBlock width={coverWidth} height={coverWidth * 1.5} radius={4} />
      <ShimmerBlock width="85%" height={12} />
      <ShimmerBlock width="55%" height={10} />
    </View>
  );
}

export function SkeletonRow({ count = 5 }: { count?: number }) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'column' }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            gap: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: c.rule,
            alignItems: 'center',
          }}
        >
          <ShimmerBlock width={56} height={84} radius={4} />
          <View style={{ flex: 1, gap: 10 }}>
            <ShimmerBlock width="60%" height={16} />
            <ShimmerBlock width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonChips({ count = 6 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {Array.from({ length: count }, (_, i) => (
        <ShimmerBlock key={i} width={88} height={30} radius={999} />
      ))}
    </View>
  );
}

export type SkeletonStyle = DimensionValue;
