// Segmented — tab control (Preview|Cite|Discussion, Notes|PQs, sort rows).
// Single-select pills with spring-feel press; full-row 44pt targets.
import { Pressable, Text, View } from 'react-native';
import { fonts, radii } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { hapticSelect } from '../motion/motion';

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (id: T) => void;
  accessibilityLabel: string;
}) {
  const c = useThemeColors();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              void hapticSelect();
              onChange(o.id);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: radii.pill,
              backgroundColor: active ? c.textPrimary : 'transparent',
              borderWidth: 1,
              borderColor: active ? c.textPrimary : c.borderStrong,
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: active ? c.bgDefault : c.textSecondary,
                fontFamily: fonts.sansMedium,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
