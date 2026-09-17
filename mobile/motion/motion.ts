// Motion system — UI.md §4. Springs first, durations mirror web tokens
// (140ms micro / 260ms screen / 480ms slow). Every animation cancellable;
// decor gets killed entirely under Reduce Motion (UI layer checks).
/* eslint-disable react-hooks/immutability -- Reanimated shared values mutate by design */
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export const durations = {
  fast: 140,
  med: 260,
  slow: 480,
} as const;

export const springGentle = {
  stiffness: 320,
  damping: 32,
  mass: 0.9,
} as const;

export const springSheet = {
  stiffness: 300,
  damping: 30,
  mass: 1,
} as const;

export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // haptics unavailable — never break interaction
  }
}

export async function hapticMedium(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // haptics unavailable — never break interaction
  }
}

export async function hapticSelect(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // haptics unavailable — never break interaction
  }
}

// Shared press-spring for custom buttons (vote/save/share clusters):
// 0.97 scale + light haptic, spring back on release.
export function usePressScale(activeScale = 0.97) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const pressIn = useCallback(() => {
    scale.value = withSpring(activeScale, springGentle);
    void hapticLight();
  }, [scale, activeScale]);
  const pressOut = useCallback(() => {
    scale.value = withSpring(1, springGentle);
  }, [scale]);
  return { animatedStyle, pressIn, pressOut };
}

// Gated decor hook: shimmer, parallax, and ambient effects render static
// (or not at all) when the OS requests reduced motion.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}
