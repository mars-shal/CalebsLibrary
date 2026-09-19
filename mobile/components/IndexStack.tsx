// IndexStack — signature visual for Bells Notes (UI.md §4).
// 2–3 layered, slightly fanned flat cards per course — replaces the book
// skeuomorph entirely. Tap fans the stack to reveal Notes/PQ split.
// Same size variant dimensions as BookCover so layout math stays stable.
/* eslint-disable react-hooks/immutability -- Reanimated shared values mutate by design */
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCallback } from 'react';
import { Svg, Circle } from 'react-native-svg';
import type { Paper } from '@shared/design';
import { fonts } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { hapticLight, springGentle, useReducedMotion } from '../motion/motion';
import { useLowData } from '../lib/store';

export type StackSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<StackSize, { w: number; fs: number; sub: number; pad: number; gap: number }> = {
  xs: { w: 60, fs: 8, sub: 6.5, pad: 6, gap: 3 },
  sm: { w: 120, fs: 12, sub: 9, pad: 10, gap: 4 },
  md: { w: 132, fs: 15, sub: 10, pad: 12, gap: 5 },
  lg: { w: 168, fs: 20, sub: 12, pad: 16, gap: 6 },
  xl: { w: 224, fs: 26, sub: 14, pad: 20, gap: 8 },
};

export interface IndexStackProps {
  paper: Paper;
  size?: StackSize;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** 0..1 download progress — renders the progress ring (functional decor). */
  progress?: number;
  /** Cached on disk — renders the downloaded dot. */
  downloaded?: boolean;
}

export function IndexStack({
  paper,
  size = 'md',
  onPress,
  accessibilityLabel,
  style,
  progress,
  downloaded = false,
}: IndexStackProps) {
  const s = SIZES[size];
  const reduceMotion = useReducedMotion();
  const theme = useThemeColors();
  const lowData = useLowData();

  // Fan-out animation state
  const fan = useSharedValue(0);
  const scale = useSharedValue(1);

  const fanStyle = useAnimatedStyle(() => ({
    // Background card offset: fanned outward by fan progress
    transform: [
      { translateY: -fan.value * s.gap * 2 },
      { rotate: `${fan.value * -4}deg` },
    ],
  }));

  const midStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -fan.value * s.gap },
      { rotate: `${fan.value * -1.5}deg` },
    ],
  }));

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = useCallback(() => {
    scale.value = withSpring(0.97, springGentle);
    if (!reduceMotion) {
      fan.value = withTiming(1, { duration: 200 });
    }
    void hapticLight();
  }, [scale, fan, reduceMotion]);

  const pressOut = useCallback(() => {
    scale.value = withSpring(1, springGentle);
    if (!reduceMotion) {
      fan.value = withTiming(0, { duration: 180 });
    }
  }, [scale, fan, reduceMotion]);

  const showRing = progress !== undefined && !downloaded;
  const ringR = 11;
  const ringC = 2 * Math.PI * ringR;

  // Card corner radii
  const cardRadius = 4;
  const cardRadiusTop = 6;

  // Colors for the stacked cards — monochrome depth layering
  const backBg = theme.bgSkeleton;
  const midBg = theme.bgDefault;
  const topBg = theme.bgElevated;
  const cardBorder = theme.borderDefault;
  const textColor = theme.textPrimary;
  const metaColor = theme.textSecondary;

  // Low-data mode: minimal code tile
  if (lowData) {
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'image'}
        accessibilityLabel={
          accessibilityLabel ?? `${paper.title}, ${paper.subjectName}, ${paper.year}`
        }
      >
        <View
          style={[
            {
              width: s.w,
              aspectRatio: 2 / 3,
              backgroundColor: theme.bgDefault,
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: cardRadius,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
            },
            style,
          ]}
        >
          <Text
            numberOfLines={2}
            style={{
              fontSize: Math.max(10, s.fs * 0.8),
              fontWeight: '700',
              color: metaColor,
              fontFamily: fonts.mono,
              textAlign: 'center',
            }}
          >
            {(paper.program || 'LIB').toUpperCase()}
          </Text>
        </View>
      </Pressable>
    );
  }

  const cardStyle: ViewStyle = {
    width: s.w,
    aspectRatio: 2 / 3,
    borderRadius: cardRadius,
    borderTopRightRadius: cardRadiusTop,
    borderBottomRightRadius: cardRadiusTop,
    borderWidth: 1,
    borderColor: cardBorder,
    position: 'absolute',
    top: 0,
    left: 0,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onPressIn={onPress ? pressIn : undefined}
      onPressOut={onPress ? pressOut : undefined}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={
        accessibilityLabel ?? `${paper.title}, ${paper.subjectName}, ${paper.year}`
      }
    >
      {/* Explicit width: every card layer is position:absolute, so without
          it the wrapper auto-sizes to 0 in ROW layouts (search/course/browse
          rows) and the sibling text column overlaps the art. BookCover
          already sets width on its tile for the same reason. */}
      <View style={[{ width: s.w, height: s.w * 1.5 + s.gap * 2 }, style]}>
        {/* Back card */}
        <Animated.View
          style={[
            cardStyle,
            { backgroundColor: backBg, zIndex: 1 },
            fanStyle,
          ]}
        />

        {/* Mid card */}
        <Animated.View
          style={[
            cardStyle,
            { backgroundColor: midBg, zIndex: 2 },
            midStyle,
          ]}
        />

        {/* Top card — the interactive one */}
        <Animated.View
          style={[
            cardStyle,
            {
              backgroundColor: topBg,
              zIndex: 3,
              boxShadow: '0px 4px 16px rgba(23, 23, 23, 0.12)',
            },
            topStyle,
          ]}
        >
          {/* Course code strip */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: theme.textPrimary,
              opacity: 0.15,
              borderTopRightRadius: cardRadiusTop,
            }}
          />

          <View style={{ flex: 1, padding: s.pad, paddingLeft: s.pad + 4 }}>
            {/* Subject/type label */}
            <Text
              numberOfLines={1}
              style={{
                fontSize: s.sub,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontWeight: '600',
                color: theme.textTertiary,
                marginTop: s.pad * 0.4,
                fontFamily: fonts.sansSemi,
              }}
            >
              {paper.subjectName || 'Notes'}
            </Text>

            {/* Title */}
            <Text
              numberOfLines={3}
              style={{
                fontSize: s.fs,
                lineHeight: s.fs * 1.15,
                fontWeight: '500',
                color: textColor,
                marginTop: s.pad * 0.4,
                fontFamily: fonts.sansMedium,
              }}
            >
              {paper.title}
            </Text>

            <View style={{ flex: 1 }} />

            {/* Bottom meta line */}
            <View
              style={{
                height: 1,
                backgroundColor: theme.borderStrong,
                marginBottom: s.pad * 0.4,
              }}
            />
            <Text
              style={{
                fontSize: s.sub,
                color: metaColor,
                fontFamily: fonts.mono,
              }}
            >
              {paper.year} · {paper.pages}pp
            </Text>
          </View>

          {/* Download progress ring / cached dot */}
          {showRing || downloaded ? (
            <View
              style={{
                position: 'absolute',
                right: 6,
                bottom: 6,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.overlay,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4,
              }}
            >
              {downloaded ? (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.bgElevated,
                  }}
                />
              ) : (
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={ringR} stroke={theme.borderStrong} strokeWidth={2.5} fill="none" />
                  <Circle
                    cx={12}
                    cy={12}
                    r={ringR}
                    stroke={theme.bgElevated}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${ringC}`}
                    strokeDashoffset={ringC * (1 - Math.min(1, Math.max(0, progress ?? 0)))}
                    transform="rotate(-90 12 12)"
                  />
                </Svg>
              )}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}
