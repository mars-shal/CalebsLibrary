// BrandMark — custom text wordmark for Caleb's Library.
// Serif italic "Caleb's" + letterspaced caps "LIBRARY", in the voice of the
// website header. Pure text (no image asset): crisp at every size, both
// themes, zero bundle cost.
import { Text, View } from 'react-native';
import { fonts } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const c = useThemeColors();
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="Caleb's Library"
      style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
    >
      <Text
        style={{
          fontFamily: fonts.serifItalic,
          fontSize: compact ? 20 : 24,
          fontWeight: '500',
          color: c.textPrimary,
          lineHeight: compact ? 24 : 28,
        }}
      >
        Caleb&apos;s
      </Text>
      <Text
        style={{
          fontFamily: fonts.sansMedium,
          fontSize: compact ? 11 : 12,
          fontWeight: '500',
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: c.textTertiary,
        }}
      >
        Library
      </Text>
    </View>
  );
}
