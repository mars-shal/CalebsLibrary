// BookCover — signature visual, native port of src/components/BookCover.vue.
// 2:3 cover, spine strip, grain whisper, COVERS[cover % 16]. No hover lift
// (dead on touch): press scales to 0.97 with a light haptic.
/* eslint-disable react-hooks/immutability -- Reanimated shared values mutate by design */
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Svg, Circle } from 'react-native-svg';
import { useCallback } from 'react';
import { COVERS, type Paper } from '@shared/design';
import { fonts } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { hapticLight, springGentle, useReducedMotion } from '../motion/motion';
import { useLowData } from '../lib/store';

export type CoverSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<CoverSize, { w: number; fs: number; sub: number; pad: number }> = {
  xs: { w: 60, fs: 8, sub: 6.5, pad: 6 },
  sm: { w: 120, fs: 12, sub: 9, pad: 10 },
  md: { w: 132, fs: 15, sub: 10, pad: 12 },
  lg: { w: 168, fs: 20, sub: 12, pad: 16 },
  xl: { w: 224, fs: 26, sub: 14, pad: 20 },
};

export interface BookCoverProps {
  paper: Paper;
  size?: CoverSize;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** 0..1 download progress — renders the progress ring (functional decor). */
  progress?: number;
  /** Cached on disk — renders the downloaded dot. */
  downloaded?: boolean;
}

export function BookCover({
  paper,
  size = 'md',
  onPress,
  accessibilityLabel,
  style,
  progress,
  downloaded = false,
}: BookCoverProps) {
  const s = SIZES[size];
  const cover = COVERS[paper.cover % COVERS.length]!;
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  // Sheen sweep: diagonal light bar crosses on press (motion-gated).
  const sheen = useSharedValue(0);
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: sheen.value * 0.22,
    transform: [{ translateX: sheen.value * s.w * 1.4 - s.w * 0.7 }],
  }));
  const pressIn = useCallback(() => {
    scale.value = withSpring(0.97, springGentle);
    if (!reduceMotion) {
      sheen.value = withSequence(withTiming(1, { duration: 380 }), withTiming(0, { duration: 0 }));
    }
    void hapticLight();
  }, [scale, sheen, reduceMotion]);
  const pressOut = useCallback(() => {
    scale.value = withSpring(1, springGentle);
  }, [scale]);
  const showRing = progress !== undefined && !downloaded;
  const ringR = 11;
  const ringC = 2 * Math.PI * ringR;
  const lowData = useLowData();
  const theme = useThemeColors();

  // Low-data mode: monochrome code tile instead of the full cover.
  // Single choke point — every list in the app degrades together.
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
              borderColor: theme.borderDefault,
              borderRadius: 4,
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
              color: theme.textSecondary,
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

  return (
    <Pressable
      onPress={onPress}
      // No handler = non-interactive: a disabled Pressable never claims the
      // responder, so taps fall through to the parent card/row (otherwise a
      // handler-less Pressable swallows cover taps and rows feel dead).
      disabled={!onPress}
      onPressIn={onPress ? pressIn : undefined}
      onPressOut={onPress ? pressOut : undefined}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={
        accessibilityLabel ?? `${paper.title}, ${paper.subjectName}, ${paper.year}`
      }
    >
      <Animated.View
        style={[
          {
            width: s.w,
            aspectRatio: 2 / 3,
            backgroundColor: cover.bg,
            borderRadius: 2,
            borderTopRightRadius: 6,
            borderBottomRightRadius: 6,
            overflow: 'hidden',
            boxShadow: '0px 8px 24px rgba(35, 32, 28, 0.18)',
          },
          animatedStyle,
          style,
        ]}
      >
        {/* spine */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            zIndex: 2,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 8,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            zIndex: 2,
          }}
        />
        {/* foil edge — metallic accent catching the light */}
        <View
          style={{
            position: 'absolute',
            left: 9,
            top: 0,
            bottom: 0,
            width: 1.5,
            backgroundColor: cover.accent,
            opacity: 0.85,
            zIndex: 2,
          }}
        />
        {/* grain whisper */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: cover.ink,
            opacity: 0.04,
          }}
        />
        {/* sheen sweep on press */}
        {!reduceMotion ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: -20,
                bottom: -20,
                width: s.w * 0.45,
                backgroundColor: '#ffffff',
                transform: [{ rotate: '-18deg' }],
                zIndex: 3,
                pointerEvents: 'none',
              },
              sheenStyle,
            ]}
          />
        ) : null}
        {/* download progress ring / cached dot */}
        {showRing || downloaded ? (
          <View
            style={{
              position: 'absolute',
              right: 6,
              bottom: 6,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
                  backgroundColor: '#ffffff',
                }}
              />
            ) : (
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={ringR} stroke="rgba(255,255,255,0.3)" strokeWidth={2.5} fill="none" />
                <Circle
                  cx={12}
                  cy={12}
                  r={ringR}
                  stroke="#ffffff"
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
        <View
          style={{
            flex: 1,
            padding: s.pad,
            paddingLeft: s.pad + 8,
          }}
        >
          <View style={{ height: 1, backgroundColor: cover.accent, opacity: 0.5 }} />
          <Text
            numberOfLines={1}
            style={{
              fontSize: s.sub,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontWeight: '600',
              color: cover.accent,
              marginTop: s.pad * 0.6,
              fontFamily: fonts.sansSemi,
            }}
          >
            {paper.subjectName || 'Notes'}
          </Text>
          <Text
            numberOfLines={4}
            style={{
              fontSize: s.fs,
              lineHeight: s.fs * 1.15,
              fontWeight: '500',
              color: cover.ink,
              marginTop: s.pad * 0.5,
              fontFamily: fonts.sansMedium,
            }}
          >
            {paper.title}
          </Text>
          <View style={{ flex: 1 }} />
          <View
            style={{ height: 1, backgroundColor: cover.accent, opacity: 0.5, marginBottom: s.pad * 0.5 }}
          />
          <Text
            style={{
              fontSize: s.sub,
              color: cover.accent,
              opacity: 0.8,
              fontFamily: fonts.mono,
            }}
          >
            {paper.year} · {paper.pages}pp
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
