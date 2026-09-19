// SafeGlass v2 — tiered liquid-glass engine (UI.md §5, extended for Android).
// The ONLY liquid-glass call-site in the app (UI.md §5). Glass hosts chrome/
// controls ONLY, never body text.
//
// Capability tiers (best first):
//   1. iOS 26+  — native GlassView (expo-glass-effect). True Apple Liquid Glass.
//   2. iOS <26  — BlurView (native UIVisualEffectView blur).
//   3. Android 12+ (API 31+) — expo-blur experimentalBlurMethod='dimezisBlurView':
//      real backdrop blur, GPU-composited via RenderEffect. Below API 31
//      dimezis degrades to slow snapshot blurring — unusable in a scrolling
//      tab bar — so those devices deliberately stay on the solid tier.
//   4. Web      — CSS backdrop-filter (blur + saturate).
//   5. Solid    — first-class elevated fill (Android <12, degraded browsers).
//
// Every blur tier (2–4) also receives the *liquid glass signature* that
// Apple paints natively on tier 1: a specular rim (light top edge, darker
// counter-edge) plus an SVG sheen — soft white wash up top, faint
// counter-sheen below.
//
// THEME RULE: tints follow the APP theme (useThemeScheme), never the OS
// scheme — otherwise the in-app toggle leaves glass behind.
import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Platform,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { track } from '../lib/analytics';
import { getKV } from '../lib/storage';
import {
  GlassView,
  GlassContainer,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { glass, light, dark } from '../theme/tokens';
import { useThemeScheme } from './ThemeProvider';

export type GlassTier = 'glass26' | 'iosBlur' | 'androidBlur' | 'webBlur' | 'solid';

export function useCanRenderGlass(): boolean {
  const tier = useGlassTier();
  return tier === 'glass26';
}

export function useGlassTier(): GlassTier {
  const [tier, setTier] = useState<GlassTier>('solid');

  useEffect(() => {
    let mounted = true;
    async function check(): Promise<void> {
      // react-native-web lacks isReduceTransparencyEnabled (iOS-native API) —
      // guard so we don't red-screen web (crash-guard carried from v1).
      const reduceTransparency =
        typeof AccessibilityInfo.isReduceTransparencyEnabled === 'function'
          ? await AccessibilityInfo.isReduceTransparencyEnabled()
          : false;
      let next: GlassTier = 'solid';
      if (Platform.OS === 'web') {
        // CSS backdrop-filter is universal in evergreen browsers.
        next = 'webBlur';
      } else if (
        Platform.OS === 'ios' &&
        isGlassEffectAPIAvailable() &&
        isLiquidGlassAvailable() &&
        !reduceTransparency
      ) {
        next = 'glass26';
      } else if (Platform.OS === 'ios') {
        next = 'iosBlur';
      } else if (Platform.OS === 'android' && !reduceTransparency) {
        // Platform.Version is the API level (number) on Android.
        const api =
          typeof Platform.Version === 'number'
            ? Platform.Version
            : parseInt(String(Platform.Version), 10);
        next = api >= 31 ? 'androidBlur' : 'solid';
      }
      // Tier telemetry — fire ONCE per device (persisted flag), not once
      // per SafeGlass mount. Every SafeGlass resolves the same tier, so one
      // sample is the whole story. Vendor is dormant (track() no-ops) until
      // Phase 7b plugs one in; the Settings support-info readout shows the
      // resolved tier on-device in the meantime.
      try {
        const kv = getKV('bellsnotes-glass');
        if (kv.getString('tier.sampled.v1') !== '1') {
          kv.set('tier.sampled.v1', '1');
          track('glass_tier_sample', { tier: next });
        }
      } catch {
        // telemetry never breaks product
      }
      if (mounted) setTier(next);
    }
    void check();
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', () => {
      void check();
    });
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);

  return tier;
}

// Fill tint that pairs with each tier: blur tiers get a light translucent
// wash (the blur supplies the depth); solid stays the near-opaque fallback.
export function glassFillFor(tier: GlassTier, scheme: 'light' | 'dark'): string {
  if (tier === 'solid') {
    return scheme === 'dark' ? glass.fallbackFillDark : glass.fallbackFillLight;
  }
  return scheme === 'dark' ? glass.blurFillDark : glass.blurFillLight;
}

export interface SafeGlassProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glassStyle?: 'clear' | 'regular';
  /** Extra color laid over the blur for composite surfaces (e.g. dock pill). */
  tint?: string;
  /**
   * Corner radius for the Android blur tier's inner clip. Defaults to the
   * design radius 28; composite surfaces (stadium dock) pass their own so
   * the tier's hard-corner container never pokes out past the host shape.
   */
  radius?: number;
}

export function SafeGlass({ children, style, glassStyle = 'regular', tint, radius = 28 }: SafeGlassProps) {
  const tier = useGlassTier();
  const scheme = useThemeScheme();

  if (tier === 'glass26') {
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        tintColor={scheme === 'dark' ? glass.tintDark : glass.tintLight}
        style={style}
      >
        {children}
      </GlassView>
    );
  }

  if (tier === 'androidBlur') {
    return <BlurTier scheme={scheme} style={style} tint={tint} radius={radius}>{children}</BlurTier>;
  }

  if (tier === 'webBlur') {
    return <WebBlurTier scheme={scheme} style={style} tint={tint}>{children}</WebBlurTier>;
  }

  if (tier === 'iosBlur') {
    return (
      <BlurView
        intensity={40}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={[{ backgroundColor: glassFillFor('iosBlur', scheme) }, style]}
      >
        {children}
      </BlurView>
    );
  }

  const theme = scheme === 'dark' ? dark : light;
  const fallbackFill = glassFillFor('solid', scheme);
  return (
    <View
      style={[
        {
          backgroundColor: fallbackFill,
          borderColor: theme.borderDefault,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// SVG sheen — the specular signature: bright wash top, faint counter-wash
// bottom. pointerEvents none; safe to layer inside any rounded container.
export function GlassSheen({ radius = 28, opacity = 1 }: { radius?: number; opacity?: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity,
        pointerEvents: 'none',
      }}
    >
    <Svg width="100%" height="100%">
      <Defs>
        <LinearGradient id="sheenTop" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.28} />
          <Stop offset="0.45" stopColor="#ffffff" stopOpacity={0.04} />
          <Stop offset="0.55" stopColor="#ffffff" stopOpacity={0} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0.1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" rx={radius} fill="url(#sheenTop)" />
    </Svg>
    </View>
  );
}

// Android 12+ real backdrop blur (dimezis BlurView via expo-blur) dressed
// with the glass signature: rim + sheen, same visual language as iOS tiers.
function BlurTier({
  scheme,
  style,
  tint,
  radius,
  children,
}: {
  scheme: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  tint?: string;
  radius: number;
  children: ReactNode;
}) {
  return (
    <View style={[{ borderRadius: radius }, style]}>
      <BlurView
        intensity={60}
        experimentalBlurMethod="dimezisBlurView"
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={[
          {
            backgroundColor: tint ?? glassFillFor('androidBlur', scheme),
            borderColor: scheme === 'dark' ? glass.edgeDark : glass.edgeLight,
            borderWidth: 1,
            borderRadius: radius,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {children}
        <GlassSheen radius={radius} />
      </BlurView>
    </View>
  );
}

// Web: CSS backdrop-filter blur + saturate — visually the closest free
// equivalent to Apple's material. Sheen via layered gradients (DOM needs no
// SVG for this).
function WebBlurTier({
  scheme,
  style,
  tint,
  children,
}: {
  scheme: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  tint?: string;
  children: ReactNode;
}) {
  const baseFill = tint ?? glassFillFor('webBlur', scheme);
  return (
    <View
      style={[
        {
          ...(Platform.OS === 'web'
            ? {
                // Web-only: real backdrop blur behind the fill.
                backdropFilter: 'blur(18px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(18px) saturate(1.6)',
              }
            : {}),
          backgroundColor: baseFill,
          borderColor: scheme === 'dark' ? glass.edgeDark : glass.edgeLight,
          borderWidth: 1,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          ...(Platform.OS === 'web'
            ? {
                // Web-only: gradient sheen (DOM — no SVG needed here).
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.1) 100%)',
              }
            : {}),
        }}
      />
    </View>
  );
}

export { GlassContainer };
