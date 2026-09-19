// BrandMark — the Bells Notes brand logo.
// The bell (the brand's namesake mark) over the wordmark set in
// Hanken Grotesk — the "Grotsek" grotesque the brand is typed in.
// Pure vector + text: crisp at every size, both themes, zero bundle cost.
import { Text, View } from 'react-native';
import { Icon } from '../icons/icons';
import { fonts } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const c = useThemeColors();
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="Bells Notes"
      style={{ alignItems: 'center', gap: compact ? 6 : 10 }}
    >
      <View style={{ marginRight: compact ? -2 : -3 }}>
        <Icon name="bell" size={compact ? 22 : 30} color={c.textPrimary} strokeWidth={1.75} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
        <Text
          style={{
            fontFamily: fonts.brand,
            fontSize: compact ? 20 : 26,
            fontWeight: '600',
            color: c.textPrimary,
            lineHeight: compact ? 24 : 32,
            letterSpacing: -0.3,
          }}
        >
          Bells
        </Text>
        <Text
          style={{
            fontFamily: fonts.brandMedium,
            fontSize: compact ? 11 : 13,
            fontWeight: '500',
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            color: c.textTertiary,
          }}
        >
          Notes
        </Text>
      </View>
    </View>
  );
}
