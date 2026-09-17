// SafeGlass — the ONLY liquid-glass call-site in the app (UI.md §5).
// iOS 26+: native GlassView after crash-guard checks. Everywhere else (and
// under Reduce Transparency / low-power): a first-class fallback — blur on
// iOS<26, solid elevated fill on Android (flagship blur lands with tier
// detection in Phase 3). Glass hosts chrome/controls ONLY, never body text.
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
import {
  GlassView,
  GlassContainer,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { glass, light, dark } from '../theme/tokens';
import { useThemeScheme } from './ThemeProvider';

export function useCanRenderGlass(): boolean {
  const [can, setCan] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check(): Promise<void> {
      const reduceTransparency = await AccessibilityInfo.isReduceTransparencyEnabled();
      const supported =
        Platform.OS === 'ios' &&
        isGlassEffectAPIAvailable() &&
        isLiquidGlassAvailable() &&
        !reduceTransparency;
      if (mounted) setCan(supported);
    }
    void check();
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', () => {
      void check();
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return can;
}

export interface SafeGlassProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glassStyle?: 'clear' | 'regular';
}

export function SafeGlass({ children, style, glassStyle = 'regular' }: SafeGlassProps) {
  const canRenderGlass = useCanRenderGlass();
  const scheme = useThemeScheme();
  const theme = scheme === 'dark' ? dark : light;

  if (canRenderGlass) {
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

  const fallbackFill =
    scheme === 'dark' ? glass.fallbackFillDark : glass.fallbackFillLight;

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={40}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={[{ backgroundColor: fallbackFill }, style]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: fallbackFill,
          borderColor: theme.rule,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export { GlassContainer };
