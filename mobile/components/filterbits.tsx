// Shared filter bits — YearStepper, TypePills, SortList.
// Used by BOTH the Browse FilterSheet and the Search FacetSheet so the two
// surfaces rank/filter identically (replaces web dual-thumb year sliders,
// which have no usable mobile equivalent).
import { Pressable, Text, View } from 'react-native';
import { PAPER_TYPES } from '@shared/design';
import { Icon } from '../icons/icons';
import { fonts, radii } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { hapticSelect } from '../motion/motion';

export function Eyebrow({ children }: { children: string }) {
  const c = useThemeColors();
  return (
    <Text
      style={{
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: 1.7,
        fontWeight: '600',
        color: c.textTertiary,
        fontFamily: fonts.sansSemi,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

export function YearStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const c = useThemeColors();
  const step = (d: number) => {
    void hapticSelect();
    onChange(Math.min(max, Math.max(min, value + d)));
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable
          onPress={() => step(-1)}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: c.ruleStrong,
          }}
        >
          <Icon name="arrow-left" size={14} color={c.textPrimary} />
        </Pressable>
        <Text
          style={{
            minWidth: 56,
            textAlign: 'center',
            fontSize: 15,
            color: c.textPrimary,
            fontFamily: fonts.mono,
          }}
        >
          {value}
        </Text>
        <Pressable
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: c.ruleStrong,
          }}
        >
          <Icon name="arrow-right" size={14} color={c.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const QUICK_TYPES = ['Notes', 'Past Exam'];

export function TypePills({
  selected,
  onToggle,
  multi = true,
}: {
  selected: string[];
  onToggle: (t: string) => void;
  multi?: boolean;
}) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {PAPER_TYPES.map((t) => {
        const active = selected.includes(t);
        const quick = QUICK_TYPES.includes(t);
        return (
          <Pressable
            key={t}
            onPress={() => {
              void hapticSelect();
              if (!multi) {
                onToggle(t);
                return;
              }
              onToggle(t);
            }}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={multi ? { checked: active } : { selected: active }}
            accessibilityLabel={`${t}${quick ? ' (quick filter)' : ''}`}
            style={{
              paddingVertical: 9,
              paddingHorizontal: 14,
              borderRadius: active ? radii.pill : 4,
              backgroundColor: active ? c.ink100 : 'transparent',
              borderWidth: 1,
              borderColor: active ? c.ink100 : c.ruleStrong,
              borderStyle: !active && !quick ? 'dashed' : 'solid',
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: active ? c.paper : c.textSecondary,
                fontFamily: fonts.sansMedium,
              }}
            >
              {t}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SortList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'column' }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              void hapticSelect();
              onChange(o.id);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Sort by ${o.label}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderBottomColor: c.rule,
              minHeight: 44,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: active ? '600' : '400',
                color: active ? c.textPrimary : c.textSecondary,
                fontFamily: active ? fonts.sansSemi : fonts.sans,
              }}
            >
              {o.label}
            </Text>
            {active ? <Icon name="check" size={16} color={c.textPrimary} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
