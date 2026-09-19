// SpotArt — bespoke LIVING line illustrations (the app's picture language).
// Theme-aware ink strokes (no new hues), decorative only (hidden from screen
// readers). Every scene carries continuous ambient loops — bobbing dots and
// arrows, twinkling rays and sparkles, swaying forms — all frozen under
// Reduce Motion. Loops run on Reanimated shared values (UI thread, 60fps).
import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';
import { useThemeColors } from './ThemeProvider';
import { useAmbientOn } from '../motion/motion';

export type SpotName =
  | 'library'
  | 'study-day'
  | 'study-night'
  | 'search'
  | 'shelf'
  | 'upload'
  | 'shield'
  | 'scroll'
  | 'link'
  | 'box'
  | 'tray';

type LoopKind = 'bob' | 'twinkle' | 'sway';

interface Accent {
  kind: LoopKind;
  duration?: number;
  content: ReactNode;
}

// One transparent overlay layer carrying a single ambient loop. Layers share
// the base viewBox so artwork stays registered pixel-perfect.
function AccentLayer({ kind, duration = 2000, children }: { kind: LoopKind; duration?: number; children: ReactNode }) {
  const ambient = useAmbientOn();
  const v = useSharedValue(kind === 'twinkle' ? 1 : kind === 'sway' ? 0.5 : 0);
  useEffect(() => {
    if (!ambient) return;
    if (kind === 'bob') {
      v.value = withRepeat(
        withTiming(-6, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else if (kind === 'twinkle') {
      v.value = withRepeat(
        withTiming(0.25, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      v.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [v, kind, duration, ambient]);
  const style = useAnimatedStyle(() => {
    if (kind === 'bob') return { transform: [{ translateY: v.value }] };
    if (kind === 'twinkle') return { opacity: v.value };
    return { transform: [{ rotate: `${-3 + 6 * v.value}deg` }] };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, pointerEvents: 'none' }, style]}
    >
      {children}
    </Animated.View>
  );
}

export function SpotArt({
  name,
  size = 120,
  opacity = 1,
}: {
  name: SpotName;
  size?: number;
  opacity?: number;
}) {
  const c = useThemeColors();
  const ink = c.textPrimary;
  const soft = c.textTertiary;
  const fill = c.bgDefault;

  const scenes: Record<SpotName, { base: ReactNode; layers: Accent[] }> = {
    'study-day': {
      base: (
        <>
          <Line x1={10} y1={82} x2={110} y2={82} stroke={soft} />
          <Rect x={26} y={70} width={44} height={9} rx={1.5} fill={fill} />
          <Rect x={30} y={61} width={38} height={9} rx={1.5} fill={fill} />
          <Rect x={26} y={52} width={30} height={9} rx={1.5} />
          <Line x1={30} y1={56.5} x2={52} y2={56.5} stroke={soft} />
          <Path d="M82 56 h14 v9 a7 7 0 0 1 -14 0 Z" fill={fill} />
          <Path d="M96 59 a5 5 0 0 1 0 6" />
          <Circle cx={88} cy={30} r={10} />
        </>
      ),
      layers: [
        {
          kind: 'twinkle',
          duration: 2000,
          content: (
            <>
              <Line x1={88} y1={12} x2={88} y2={16} />
              <Line x1={88} y1={44} x2={88} y2={48} />
              <Line x1={70} y1={30} x2={74} y2={30} />
              <Line x1={102} y1={30} x2={106} y2={30} />
            </>
          ),
        },
        {
          kind: 'bob',
          duration: 2600,
          content: (
            <>
              <Path d="M86 48 q2 -4 0 -8 M94 48 q2 -4 0 -8" stroke={soft} />
              <Circle cx={28} cy={34} r={1.8} fill={soft} stroke="none" />
              <Circle cx={44} cy={22} r={1.5} fill={soft} stroke="none" />
            </>
          ),
        },
      ],
    },
    'study-night': {
      base: (
        <>
          <Line x1={10} y1={82} x2={110} y2={82} stroke={soft} />
          <Rect x={26} y={70} width={44} height={9} rx={1.5} fill={fill} />
          <Rect x={30} y={61} width={38} height={9} rx={1.5} fill={fill} />
          <Path d="M30 50 Q43 44 56 50 Q69 44 82 50 L82 60 Q69 54 56 60 Q43 54 30 60 Z" fill={fill} />
          <Path d="M78 16 A17 17 0 1 0 78 52 A13.5 13.5 0 1 1 78 16 Z" fill={fill} />
        </>
      ),
      layers: [
        {
          kind: 'twinkle',
          duration: 2200,
          content: (
            <>
              <Path d="M30 26 v9 M25.5 30.5 h9" stroke={soft} />
              <Path d="M98 60 v7 M94.5 63.5 h7" stroke={soft} />
              <Circle cx={48} cy={20} r={1.6} fill={soft} stroke="none" />
              <Circle cx={104} cy={38} r={1.6} fill={soft} stroke="none" />
              <Circle cx={20} cy={52} r={1.4} fill={soft} stroke="none" />
            </>
          ),
        },
        {
          kind: 'bob',
          duration: 2800,
          content: <Circle cx={64} cy={30} r={1.6} fill={soft} stroke="none" />,
        },
      ],
    },
    library: {
      base: (
        <>
          <Line x1={12} y1={80} x2={108} y2={80} stroke={soft} />
          <Path
            d="M30 62 Q45 54 60 62 Q75 54 90 62 L90 74 Q75 66 60 74 Q45 66 30 74 Z"
            fill={fill}
          />
          <Line x1={60} y1={62} x2={60} y2={74} />
          <Circle cx={60} cy={32} r={11} />
        </>
      ),
      layers: [
        {
          kind: 'twinkle',
          duration: 1800,
          content: (
            <>
              <Line x1={60} y1={12} x2={60} y2={16} />
              <Line x1={60} y1={48} x2={60} y2={52} />
              <Line x1={40} y1={32} x2={44} y2={32} />
              <Line x1={76} y1={32} x2={80} y2={32} />
            </>
          ),
        },
        {
          kind: 'bob',
          duration: 2400,
          content: (
            <>
              <Circle cx={30} cy={40} r={1.8} fill={soft} stroke="none" />
              <Circle cx={90} cy={44} r={1.8} fill={soft} stroke="none" />
              <Circle cx={82} cy={20} r={1.5} fill={soft} stroke="none" />
            </>
          ),
        },
      ],
    },
    search: {
      base: (
        <>
          <Circle cx={50} cy={44} r={20} />
          <Line x1={64} y1={58} x2={82} y2={76} strokeWidth={5} />
          <Path d="M41 45 Q46 41 51 44 Q56 41 61 44" stroke={soft} />
        </>
      ),
      layers: [
        {
          kind: 'twinkle',
          duration: 2000,
          content: (
            <>
              <Path d="M90 22 v10 M85 27 h10" stroke={soft} />
              <Circle cx={28} cy={72} r={1.8} fill={soft} stroke="none" />
            </>
          ),
        },
      ],
    },
    shelf: {
      base: (
        <>
          <Line x1={14} y1={58} x2={106} y2={58} strokeWidth={3} />
          <Line x1={14} y1={82} x2={106} y2={82} strokeWidth={3} />
          <Rect x={24} y={40} width={8} height={18} fill={fill} />
          <Rect x={34} y={34} width={6} height={24} fill={fill} />
          <Rect x={42} y={44} width={10} height={14} fill={fill} />
          <Path d="M58 58 L64 38 L70 40 L64 58 Z" fill={fill} />
          <Rect x={30} y={68} width={16} height={5} fill={fill} />
          <Rect x={32} y={74} width={12} height={5} fill={fill} />
        </>
      ),
      layers: [
        {
          kind: 'bob',
          duration: 2600,
          content: (
            <>
              <Circle cx={88} cy={70} r={6} stroke={soft} />
              <Line x1={88} y1={70} x2={88} y2={70} stroke={soft} />
            </>
          ),
        },
      ],
    },
    upload: {
      base: (
        <>
          <Path d="M30 60 H44 V74 H76 V60" />
          <Rect x={80} y={22} width={14} height={18} fill={fill} />
          <Line x1={83} y1={28} x2={91} y2={28} stroke={soft} />
          <Line x1={83} y1={33} x2={91} y2={33} stroke={soft} />
        </>
      ),
      layers: [
        {
          kind: 'bob',
          duration: 1600,
          content: (
            <>
              <Line x1={60} y1={28} x2={60} y2={56} />
              <Path d="M51 37 L60 28 L69 37" />
            </>
          ),
        },
      ],
    },
    shield: {
      base: (
        <>
          <Path d="M60 12 L88 22 V48 C88 68 76 78 60 84 C44 78 32 68 32 48 V22 Z" fill={fill} />
          <Path d="M50 50 L57 57 L71 41" />
        </>
      ),
      layers: [],
    },
    scroll: {
      base: (
        <>
          <Path d="M44 12 H74 L88 26 V82 H44 Z" fill={fill} />
          <Path d="M74 12 V26 H88" />
          <Line x1={52} y1={40} x2={80} y2={40} stroke={soft} />
          <Line x1={52} y1={48} x2={80} y2={48} stroke={soft} />
          <Line x1={52} y1={56} x2={72} y2={56} stroke={soft} />
        </>
      ),
      layers: [
        {
          kind: 'twinkle',
          duration: 2200,
          content: <Circle cx={52} cy={70} r={4} stroke={soft} />,
        },
      ],
    },
    link: {
      base: (
        <>
          <Circle cx={24} cy={70} r={1.8} fill={soft} stroke="none" />
          <Circle cx={96} cy={26} r={1.8} fill={soft} stroke="none" />
        </>
      ),
      layers: [
        {
          kind: 'sway',
          duration: 2800,
          content: (
            <>
              <Rect x={26} y={38} width={30} height={18} rx={9} transform="rotate(45 41 47)" fill={fill} />
              <Rect x={64} y={38} width={30} height={18} rx={9} transform="rotate(45 79 47)" />
            </>
          ),
        },
      ],
    },
    box: {
      base: (
        <>
          <Path d="M35 48 H85 V78 H35 Z" fill={fill} />
          <Path d="M35 48 L28 38 H44 L51 48" />
          <Path d="M85 48 L92 38 H76 L69 48" />
          <Line x1={48} y1={62} x2={72} y2={62} stroke={soft} />
        </>
      ),
      layers: [
        {
          kind: 'twinkle',
          duration: 1900,
          content: <Path d="M56 22 v8 M52 26 h8" stroke={soft} />,
        },
      ],
    },
    tray: {
      base: (
        <>
          <Path d="M32 58 L40 78 H80 L88 58" fill={fill} />
          <Line x1={28} y1={58} x2={92} y2={58} strokeWidth={3} />
        </>
      ),
      layers: [
        {
          kind: 'bob',
          duration: 1500,
          content: (
            <>
              <Line x1={60} y1={20} x2={60} y2={52} />
              <Path d="M51 43 L60 52 L69 43" />
            </>
          ),
        },
      ],
    },
  };

  const scene = scenes[name];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size * 0.8, opacity }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 120 96"
        fill="none"
        stroke={ink}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {scene.base}
      </Svg>
      {scene.layers.map((l, i) => (
        <AccentLayer key={i} kind={l.kind} duration={l.duration}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 120 96"
            fill="none"
            stroke={ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {l.content}
          </Svg>
        </AccentLayer>
      ))}
    </View>
  );
}
