// HapticPressable — the app-wide touchable with tactile + visible feedback.
//
// A drop-in `Pressable` replacement: identical props (typed as RN's), plus
// two behaviors on press-in —
//   1. a LIGHT impact haptic (micro-confirmation at finger-down, not an
//      action confirmation — the action's own feedback is the screen
//      change / toast / sheet), and
//   2. a unified 0.97 press-down scale so every touchable visibly responds
//      alongside the buzz (springs back on release via `springGentle`).
//
// Mechanism: createAnimatedComponent(Pressable) with the scale merged into
// the style array — no child wrapper, so every caller layout (rows, cards,
// 44pt targets) is untouched. Callers must not pass function-style `style`
// (none do; verified) since the animated style merges statically.
//
// Usage: swap the import —
//   import { Pressable } from 'react-native'  →  import HapticPressable from '@/components/HapticPressable';
//
// Intentionally NOT used where a component already runs its own press
// feedback (BookCover/IndexStack — custom press springs + haptic; dock tabs
// and the paper action cluster have their own haptic tiers) so taps never
// double-buzz.
import { forwardRef, useCallback, type ComponentProps } from 'react';
import { Pressable } from 'react-native';
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimatedProps,
} from 'react-native-reanimated';
import { hapticLight, springGentle } from '../motion/motion';

const AnimatedPressable = createAnimatedComponent(Pressable);

type PressableProps = ComponentProps<typeof Pressable>;
// AnimatedProps<> makes `key`/`ref` animated-optional (SharedValue<Key>),
// which breaks JSX spreading — so intersect the two instead:
export type HapticPressableProps = PressableProps & {
  /** Reanimated entrance animation (staggered entrances app-wide). */
  entering?: AnimatedProps<PressableProps>['entering'];
  exiting?: AnimatedProps<PressableProps>['exiting'];
  layout?: AnimatedProps<PressableProps>['layout'];
};

const HapticPressable = forwardRef<unknown, HapticPressableProps>(function HapticPressable(
  { onPressIn, onPressOut, style, entering, exiting, layout, ...rest },
  ref,
) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<HapticPressableProps['onPressIn']>>[0]) => {
      scale.value = withSpring(0.97, springGentle);
      void hapticLight();
      onPressIn?.(e);
    },
    [scale, onPressIn],
  );
  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<HapticPressableProps['onPressOut']>>[0]) => {
      scale.value = withSpring(1, springGentle);
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  return (
    <AnimatedPressable
      ref={ref as never}
      {...rest}
      style={[style, animatedStyle]}
      entering={entering}
      exiting={exiting}
      layout={layout}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    />
  );
});

export default HapticPressable;
