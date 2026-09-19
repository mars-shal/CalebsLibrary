// Icon set — Bells Notes. 24×24, 1.5px stroke, round caps.
// New stroke-icon set: cleaner geometry, distinct from old Caleb's Library set.
/* eslint-disable react-hooks/immutability -- Reanimated shared values mutate by design */
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useCallback } from 'react';
import { hapticLight, springGentle } from '../motion/motion';

const PATHS: Record<string, string> = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5"/><path d="M10 20v-5h4v5"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.5-6.5-6 0-2.3 1.3-4.4 2.9-6.2C10 7 11.5 5.5 12 3c2.5 2 3 4 2.7 5.8 1 .4 2.3 1.6 2.3 3.7 1 .9 1.5 1.7 1.5 2.5 0 3.5-2.6 6-6.5 6z"/><path d="M12 21c-1.8 0-3-1.4-3-3.1 0-1.6 1.2-2.7 3-4.4 1.8 1.7 3 2.8 3 4.4 0 1.7-1.2 3.1-3 3.1z"/>',
  hourglass: '<path d="M7 3h10"/><path d="M7 21h10"/><path d="M8 3v3.5c0 2 3 3.5 4 5.5 1-2 4-3.5 4-5.5V3"/><path d="M8 21v-3.5c0-2 3-3.5 4-5.5 1 2 4 3.5 4 5.5V21"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  books: '<path d="M5 4h3v16H5z"/><path d="M10 4h3v16h-3z"/><path d="M15 5l4 1.5-4 13.5L13.5 19z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m19 19-4-4"/>',
  upload: '<path d="M12 15V5m0 0-4 4m4-4 4 4"/><path d="M5 19h14"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  dashboard: '<rect x="4" y="4" width="6" height="8" rx="1"/><rect x="14" y="4" width="6" height="4" rx="1"/><rect x="14" y="12" width="6" height="8" rx="1"/><rect x="4" y="16" width="6" height="4" rx="1"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6l-7-3z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.5v4M12 8h.01"/>',
  bookmark: '<path d="M7 4h10v17l-5-3.5L7 21V4z"/>',
  download: '<path d="M12 4v11m0 0-3.5-3.5m3.5 3.5 3.5-3.5"/><path d="M5 18h14"/>',
  'arrow-up': '<path d="M12 18V6m0 0-5 5m5-5 5 5"/>',
  'arrow-down': '<path d="M12 6v12m0 0-5-5m5 5 5-5"/>',
  'arrow-right': '<path d="M6 12h12m0 0-5-5m5 5-5 5"/>',
  'arrow-left': '<path d="M18 12H6m0 0 5-5m-5 5 5 5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 8"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  filter: '<path d="M4 6h16l-6.5 8v4.5L9 21v-4.5L4 6z"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  list: '<path d="M9 7h10M9 12h10M9 17h10M5 7h.01M5 12h.01M5 17h.01"/>',
  star: '<path d="m12 3 2.3 5.2 5.7.5-4.3 4 1.3 5.8L12 15.5l-5 3 1.3-5.8-4.3-4 5.7-.5z"/>',
  book: '<path d="M5 5v14a1 1 0 0 0 1 1h13"/><path d="M7 5h11v13H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
  file: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9l-5-6z"/><path d="M14 3v5h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2.5"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H5l3-3a8 8 0 1 1 14-5z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8 13 7 3.5M16 6.5l-7 3.5"/>',
  cite: '<path d="M8 8h3v5c0 1.5-.8 2.5-2.5 2.5M15 8h3v5c0 1.5-.8 2.5-2.5 2.5"/>',
  sparkle: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.8 5.8l2.1 2.1m8.2 8.2 2.1 2.1M5.8 18.2l2.1-2.1m8.2-8.2 2.1-2.1"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  settings: '<circle cx="12" cy="12" r="2.5"/><path d="M19.4 14.5a1.5 1.5 0 0 0 .3 1.6l.1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.5 1.5 0 0 0-1.6-.3 1.5 1.5 0 0 0-.9 1.3V20a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-1-1.3 1.5 1.5 0 0 0-1.6.3l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.5 1.5 0 0 0 .3-1.6V14a1.5 1.5 0 0 0-1.3-1H4a1.8 1.8 0 1 1 0-3.6h.1A1.5 1.5 0 0 0 5.4 8.3l.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.5 1.5 0 0 0 1.6.3H10a1.5 1.5 0 0 0 1-1.3V4a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 1 1.3 1.5 1.5 0 0 0 1.6-.3l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.5 1.5 0 0 0-.3 1.6V9a1.5 1.5 0 0 0 1.3 1H20a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.3 1z"/>',
  trending: '<path d="M4 17l5-5 3.5 3.5L20 9"/><path d="M15 9h5v5"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.5 4.5 4.5 0 0 1 8 2.5c0 5.5-7 10-7 10-.8.4-1.2.4-2 0z"/>',
  'more-h': '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  flag: '<path d="M5 21V5m0 0h11l-2 3.5 2 3.5H5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M19 12a7 7 0 1 1-2-5"/><path d="M19 5v4h-4"/>',
  sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2m0 15v2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5M2.5 12h2m15 0h2M4.9 19.1l1.5-1.5m11.2-11.2 1.5-1.5"/>',
  moon: '<path d="M20 12.5A8.5 8.5 0 1 1 11.5 4a6.5 6.5 0 0 0 8.5 8.5z"/>',
};

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS);

export interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.5 }: IconProps) {
  const inner = PATHS[name] ?? '';
  const xml =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">` +
    `${inner}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export interface PressableIconProps extends IconProps {
  onPress?: () => void;
  accessibilityLabel: string;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
}

// 44pt touch target, spring press (0.97) + light haptic. All icon buttons
// MUST use this (web left vote/save/share/filter/sort unlabeled).
export function PressableIcon({
  onPress,
  accessibilityLabel,
  hitSlop = 10,
  style,
  ...icon
}: PressableIconProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const pressIn = useCallback(() => {
    scale.value = withSpring(0.9, springGentle);
    void hapticLight();
  }, [scale]);
  const pressOut = useCallback(() => {
    scale.value = withSpring(1, springGentle);
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={[{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Animated.View style={animatedStyle}>
        <Icon {...icon} />
      </Animated.View>
    </Pressable>
  );
}
