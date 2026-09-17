// Ornament — thin rule with a center dot (port of web .ornament).
// Section divider for editorial rhythm; decorative only.
import { View } from 'react-native';
import { useThemeColors } from './ThemeProvider';

export function Ornament() {
  const c = useThemeColors();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: c.rule }} />
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.textQuiet }} />
      <View style={{ flex: 1, height: 1, backgroundColor: c.rule }} />
    </View>
  );
}
