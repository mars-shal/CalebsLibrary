// Avatar — monochromatic ink circle (port of Avatar.vue).
import { Text, View } from 'react-native';
import { initialsOf } from '@shared/design';
import { fonts } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';

export function Avatar({ name, size = 32 }: { name?: string; size?: number }) {
  const c = useThemeColors();
  if (!name) return null;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: c.bgDefault, fontSize: size * 0.42, fontWeight: '500', fontFamily: fonts.sansMedium }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
