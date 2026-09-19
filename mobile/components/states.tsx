// States — Empty / Error / OfflineBadge. Every screen gets all three;
// never a blank view (UI.md §2.6). Empty states are ILLUSTRATED (SpotArt
// scenes fill the white space) and float gently — ambient loops are cut on
// low-end/low-data devices and under Reduce Motion.
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Icon, type IconName } from '../icons/icons';
import { SpotArt, type SpotName } from './SpotArt';
import { entrance, useAmbientOn } from '../motion/motion';
import { fonts, radii, spacing } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';

// Default illustration per fallback icon — every empty state gets a scene,
// even when the caller only passed an icon.
const ICON_SPOT: Partial<Record<IconName, SpotName>> = {
  books: 'library',
  search: 'search',
  bookmark: 'box',
  upload: 'upload',
  tray: 'tray',
};

function FloatingIcon({ name, color }: { name: IconName; color: string }) {
  const ambient = useAmbientOn();
  const y = useSharedValue(0);
  useEffect(() => {
    if (!ambient) return;
    y.value = withRepeat(withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [y, ambient]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={style}>
      <Icon name={name} size={28} color={color} />
    </Animated.View>
  );
}

export interface EmptyStateProps {
  icon?: IconName;
  /** Spot illustration — preferred over the icon wherever a scene fits. */
  art?: SpotName;
  title: string;
  sub?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon = 'books', art, title, sub, ctaLabel, onCta }: EmptyStateProps) {
  const c = useThemeColors();
  const scene: SpotName | undefined = art ?? ICON_SPOT[icon];
  return (
    <Animated.View
      accessibilityRole="text"
      entering={entrance.soft()}
      style={{
        padding: spacing.xxl,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: c.borderStrong,
        borderRadius: radii.card,
        backgroundColor: c.bgElevated,
        gap: 8,
      }}
    >
      {scene ? (
        <SpotArt name={scene} size={120} />
      ) : (
        <FloatingIcon name={icon} color={c.textTertiary} />
      )}
      <Text style={{ fontSize: 18, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, textAlign: 'center' }}>
        {title}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 14, color: c.textTertiary, fontFamily: fonts.sans, textAlign: 'center' }}>
          {sub}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <HapticPressable
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={{
            marginTop: 8,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 8,
            backgroundColor: c.textPrimary,
          }}
        >
          <Text style={{ color: c.bgDefault, fontWeight: '500', fontFamily: fonts.sansMedium }}>{ctaLabel}</Text>
        </HapticPressable>
      ) : null}
    </Animated.View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useThemeColors();
  return (
    <Animated.View
      entering={entrance.fade()}
      style={{ padding: spacing.xxl, alignItems: 'center', gap: 8 }}
    >
      <SpotArt name="scroll" size={88} />
      <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans, textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry ? (
        <HapticPressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={{
            marginTop: 4,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: c.borderStrong,
          }}
        >
          <Text style={{ color: c.textPrimary, fontWeight: '500', fontFamily: fonts.sansMedium }}>Retry</Text>
        </HapticPressable>
      ) : null}
    </Animated.View>
  );
}

export function OfflineBadge() {
  const c = useThemeColors();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Offline — showing cached content"
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: c.bgDefault,
        borderWidth: 1,
        borderColor: c.borderDefault,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.textTertiary }} />
      <Text style={{ fontSize: 11, color: c.textSecondary, fontFamily: fonts.mono }}>OFFLINE · CACHED</Text>
    </View>
  );
}
