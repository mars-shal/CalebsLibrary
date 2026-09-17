// States — Empty / Error / OfflineBadge. Every screen gets all three;
// never a blank view (UI.md §2.6). Empty icons float gently (reduced-motion
// gated) — the ambient moment for empty shelves.
import { Pressable, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Icon, type IconName } from '../icons/icons';
import { SpotArt, type SpotName } from './SpotArt';
import { fonts, radii, spacing } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { useReducedMotion } from '../motion/motion';

function FloatingIcon({ name, color }: { name: IconName; color: string }) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    y.value = withRepeat(withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [y, reduceMotion]);
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
  return (
    <View
      accessibilityRole="text"
      style={{
        padding: spacing.xxl,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: c.ruleStrong,
        borderRadius: radii.card,
        gap: 8,
      }}
    >
      {art ? (
        <SpotArt name={art} size={120} />
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
        <Pressable
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={{
            marginTop: 8,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 4,
            backgroundColor: c.ink100,
          }}
        >
          <Text style={{ color: c.paper, fontWeight: '500', fontFamily: fonts.sansMedium }}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useThemeColors();
  return (
    <View style={{ padding: spacing.xxl, alignItems: 'center', gap: 8 }}>
      <Icon name="info" size={24} color={c.error} />
      <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans, textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={{
            marginTop: 4,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: c.ruleStrong,
          }}
        >
          <Text style={{ color: c.textPrimary, fontWeight: '500', fontFamily: fonts.sansMedium }}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
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
        backgroundColor: c.paper2,
        borderWidth: 1,
        borderColor: c.rule,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.textTertiary }} />
      <Text style={{ fontSize: 11, color: c.textSecondary, fontFamily: fonts.mono }}>OFFLINE · CACHED</Text>
    </View>
  );
}
