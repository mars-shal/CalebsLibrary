// Theme tokens — Bells Notes monochrome identity (UI.md §§1/3).
// Monochrome only: grayscale contrast + weight, no hue-based palette.
// Radii, spacing, shadow-to-native mapping, max-width buckets are structurally
// unchanged from the original — those were never brand-colored decisions.

export const light = {
  paper: '#f7f5f2',
  paper2: '#efece7',
  paper3: '#e3dfd9',
  paper4: '#d6d1ca',
  ink0: '#ffffff',
  ink10: '#eae7e2',
  ink20: '#d6d1ca',
  ink30: '#aaa49b',
  ink40: '#7d766c',
  ink50: '#5c554c',
  ink70: '#443f38',
  ink85: '#2b2723',
  ink100: '#1c1917',
  rule: 'rgba(28, 25, 23, 0.08)',
  ruleStrong: 'rgba(28, 25, 23, 0.16)',
  elevated: '#fffefb',
  pdf: '#f2efe9',
  error: '#1c1917',
  overlay: 'rgba(28, 25, 23, 0.9)',
  textPrimary: '#1c1917',
  textSecondary: '#44403c',
  textTertiary: '#79726a',
  textQuiet: '#a8a29e',
  bgDefault: '#f7f5f2',
  bgElevated: '#fffefb',
  bgSkeleton: '#e3dfd9',
  borderDefault: 'rgba(28, 25, 23, 0.08)',
  borderStrong: 'rgba(28, 25, 23, 0.16)',
} as const;

export const dark = {
  // True-black paper (OLED): the brand's dark mode sits at #000 with warm
  // lifted inks — deeper than the old #0a0a0a, softer text for comfort.
  paper: '#000000',
  paper2: '#0a0a0a',
  paper3: '#141414',
  paper4: '#232323',
  ink0: '#000000',
  ink10: '#161616',
  ink20: '#2a2a2a',
  ink30: '#4a4a4a',
  ink40: '#7a7773',
  ink50: '#a6a29c',
  ink70: '#d1cdc7',
  ink85: '#e8e5e0',
  ink100: '#f4f1ec',
  rule: 'rgba(244, 241, 236, 0.08)',
  ruleStrong: 'rgba(244, 241, 236, 0.15)',
  elevated: '#0f0e0d',
  pdf: '#0a0a0a',
  error: '#f4f1ec',
  overlay: 'rgba(0, 0, 0, 0.92)',
  textPrimary: '#f4f1ec',
  textSecondary: '#d1cdc7',
  textTertiary: '#a6a29c',
  textQuiet: '#7a7773',
  bgDefault: '#000000',
  bgElevated: '#0f0e0d',
  bgSkeleton: '#161616',
  borderDefault: 'rgba(244, 241, 236, 0.08)',
  borderStrong: 'rgba(244, 241, 236, 0.15)',
} as const;

export type Theme = typeof light | typeof dark;
export type ColorScheme = 'light' | 'dark';

// Glass + fallback fills (UI.md §7). Tints derive from monochrome scale.
export const glass = {
  tintLight: 'rgba(247, 245, 242, 0.55)',
  tintDark: 'rgba(0, 0, 0, 0.55)',
  borderLight: 'rgba(255, 255, 255, 0.3)',
  fallbackFillLight: 'rgba(247, 245, 242, 0.94)',
  fallbackFillDark: 'rgba(0, 0, 0, 0.94)',
  // Liquid Glass on non-iOS26 tiers (v2): translucent fills that sit OVER a
  // live backdrop blur (Android 12+ dimezis / web backdrop-filter). Much
  // lighter than the 0.92 solid-fallback washes — the blur does the work.
  blurFillLight: 'rgba(247, 245, 242, 0.62)',
  blurFillDark: 'rgba(0, 0, 0, 0.52)',
  // Specular rim for blur tiers (SVG sheen adds the white highlights).
  edgeLight: 'rgba(255, 255, 255, 0.5)',
  edgeDark: 'rgba(255, 255, 255, 0.16)',
} as const;

// Radii evolve Apple-ward (web 2/3/5/10/16 → app values). Pills stay 999.
export const radii = {
  card: 8,
  sheet: 14,
  hero: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  gutter: 20,
  cardGutter: 16,
} as const;

// Type roles. Serif reserved: About/404 editorial moments ONLY.
// Hanken Grotesk (brand wordmark "Grotsek"), General Sans (UI body), JetBrains Mono (meta).
export const fonts = {
  brand: 'HankenGrotesk-SemiBold',
  brandMedium: 'HankenGrotesk-Medium',
  serif: 'Fraunces_500Medium',
  serifItalic: 'Fraunces_500Medium_Italic',
  sans: 'GeneralSans-Regular',
  sansMedium: 'GeneralSans-Medium',
  sansSemi: 'GeneralSans-Semibold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const typeSizes = {
  eyebrow: 10.5,
  meta: 11,
  body: 14,
  bodyLarge: 15,
  title: 20,
  titleLarge: 28,
  hero: 34,
  heroLarge: 44,
  stat: 30,
} as const;

export const maxWidth = {
  phone: 480,
  tablet: 720,
} as const;
