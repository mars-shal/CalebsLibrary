// Theme tokens — exact port of src/assets/tokens.css + UI.md §§1/3.
// FIDELITY RULE: hexes, families, and brand language match the website
// exactly. Own direction lives in radii/layout/motion/chrome only.

// Theme tokens — softened evolution of src/assets/tokens.css + UI.md §§1/3.
// FIDELITY RULE (amended per user): same hues and brand language as the
// website, but light mode steps toward a softer off-white and the charcoal
// eases off pure-black harshness. Own direction lives in radii/layout/
// motion/chrome only.

export const light = {
  paper: '#f7f4ec',
  paper2: '#f0ece1',
  paper3: '#e7e1d3',
  paper4: '#d6cfbd',
  ink0: '#ffffff',
  ink10: '#e2dccf',
  ink20: '#bfb7a8',
  ink30: '#978e80',
  ink40: '#756c63',
  ink50: '#575046',
  ink70: '#46403a',
  ink85: '#2e2925',
  ink100: '#23201c',
  rule: 'rgba(35, 32, 28, 0.08)',
  ruleStrong: 'rgba(35, 32, 28, 0.14)',
  elevated: '#faf8f1',
  pdf: '#fdfaf3',
  error: '#bb4436',
  overlay: 'rgba(35, 32, 28, 0.9)',
  textPrimary: '#23201c',
  textSecondary: '#46403a',
  textTertiary: '#756c63',
  textQuiet: '#978e80',
} as const;

export const dark = {
  paper: '#151311',
  paper2: '#1d1a17',
  paper3: '#252320',
  paper4: '#3a3632',
  ink0: '#000000',
  ink10: '#2a2825',
  ink20: '#403d39',
  ink30: '#5c5852',
  ink40: '#7a7570',
  ink50: '#9a958f',
  ink70: '#bdb8b1',
  ink85: '#ddd9d3',
  ink100: '#ece7e0',
  rule: 'rgba(236, 231, 224, 0.1)',
  ruleStrong: 'rgba(236, 231, 224, 0.18)',
  elevated: '#1a1816',
  pdf: '#1a1816',
  error: '#e74c3c',
  overlay: 'rgba(21, 19, 17, 0.92)',
  textPrimary: '#ece7e0',
  textSecondary: '#bdb8b1',
  textTertiary: '#7a7570',
  textQuiet: '#5c5852',
} as const;

export type Theme = typeof light | typeof dark;
export type ColorScheme = 'light' | 'dark';

// Glass + fallback fills (UI.md §3). Tints derive from paper/ink only.
export const glass = {
  tintLight: 'rgba(247, 244, 236, 0.55)',
  tintDark: 'rgba(21, 19, 17, 0.55)',
  borderLight: 'rgba(255, 255, 255, 0.35)',
  fallbackFillLight: 'rgba(247, 244, 236, 0.92)',
  fallbackFillDark: 'rgba(21, 19, 17, 0.92)',
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

// Type roles. Serif reserved: brand/masthead/About/404 ONLY.
export const fonts = {
  serif: 'EBGaramond_500Medium',
  serifItalic: 'EBGaramond_500Medium_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
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
