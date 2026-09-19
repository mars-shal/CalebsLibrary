// ScopePill — "Level 200 · CSC" / "All levels" scope indicator.
// Tap opens scope editing (onboarding revisit). Balanced-rows companion:
// one line of context, zero clutter.
import { Pressable, Text } from 'react-native';
import { Icon } from '../icons/icons';
import { fonts, radii } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { useOnboarding, type LevelYear } from '../lib/store';
import { hapticSelect } from '../motion/motion';

const LEVEL_LABEL: Record<LevelYear, string> = {
  '1': '100 Level',
  '2': '200 Level',
  '3': '300 Level',
  '4': '400 Level',
  '5': '500 Level',
  all: 'All levels',
};

export function scopeLabel(program: string, levelYear: LevelYear): string {
  const lvl = LEVEL_LABEL[levelYear] ?? 'All levels';
  if (program === 'all' && levelYear === 'all') return 'All levels';
  if (program === 'all') return lvl;
  if (levelYear === 'all') return program.toUpperCase();
  return `${lvl} · ${program.toUpperCase()}`;
}

export function ScopePill({ onPress }: { onPress: () => void }) {
  const c = useThemeColors();
  const program = useOnboarding((s) => s.program);
  const levelYear = useOnboarding((s) => s.levelYear);
  return (
    <Pressable
      onPress={() => {
        void hapticSelect();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Study scope: ${scopeLabel(program, levelYear)}. Change scope.`}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: c.borderStrong,
        minHeight: 44,
      }}
    >
      <Icon name="user" size={14} color={c.textSecondary} />
      <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
        {scopeLabel(program, levelYear)}
      </Text>
      <Icon name="chevron" size={12} color={c.textTertiary} />
    </Pressable>
  );
}
