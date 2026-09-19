// HeroMark — the Home hero as a living icon for Bells Notes.
// A stack of index cards (the app's signature visual) floating gently,
// a twinkling sparkle, and a day/night accent. Everything freezes
// under Reduce Motion.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Icon } from '../icons/icons';
import { useThemeColors } from './ThemeProvider';
import { useReducedMotion } from '../motion/motion';

export function HeroMark({ night }: { night: boolean }) {
  const c = useThemeColors();
  const reduceMotion = useReducedMotion();
  const float = useSharedValue(0);
  const tw = useSharedValue(1);
  const tw2 = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    float.value = withRepeat(
      withTiming(-7, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    tw.value = withRepeat(
      withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    tw2.value = withRepeat(
      withTiming(0.2, { duration: 2300, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [float, tw, tw2, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));
  const twStyle = useAnimatedStyle(() => ({ opacity: tw.value }));
  const tw2Style = useAnimatedStyle(() => ({ opacity: tw2.value }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: 148,
          height: 148,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={floatStyle}>
          <Icon name="books" size={80} color={c.textPrimary} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', top: 26, right: 32 }, twStyle]}>
          <Icon name="sparkle" size={16} color={c.textTertiary} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', bottom: 30, left: 30 }, tw2Style]}>
          <Icon name={night ? 'moon' : 'sun'} size={15} color={c.textTertiary} />
        </Animated.View>
      </View>
    </View>
  );
}
