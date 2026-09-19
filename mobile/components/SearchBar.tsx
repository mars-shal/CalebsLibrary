// SearchBar — compact search input with max-6 autocomplete dropdown.
// When idle (empty + unfocused), course-flavoured hints type and erase
// themselves in the placeholder (motion-gated). Parents own data, commit
// side-effects, and optional focus interception (Home phases into Search).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import type { Paper } from '@shared/design';
import { Icon } from '../icons/icons';
import { IndexStack } from './IndexStack';
import { HighlightText } from './HighlightText';
import { fonts, radii } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { useReducedMotion } from '../motion/motion';

export interface Suggestion {
  text: string;
  type: 'paper' | 'subject' | 'course';
  icon: 'book' | 'grid' | 'list';
}

const MIN_LENGTH = 2;
const MAX_SUGGESTIONS = 6;

const IDLE_HINTS = [
  'Try “CSC 200 past questions”…',
  'Find “MTH 103” lecture notes…',
  '“Thermodynamics” study guides…',
  '“Photosynthesis” cheat sheets…',
  '“Data Structures” solved sets…',
  '“Organic Chemistry” master sheet…',
  '“Cell Biology” detailed notes…',
];

export function SearchBar({
  value,
  onChange,
  onCommit,
  onSeeAll,
  topResults = [],
  onOpenPaper,
  papers = [],
  subjectNames = [],
  courseNames = [],
  placeholder = 'Search the library…',
  autoFocus = false,
  accessibilityLabel = 'Search the library',
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: (q: string) => void;
  /** Explicit "see all results" action — navigation fires ONLY from taps/
  submit, never from focus (WCAG 3.2.1 + avoids keyboard-transition races). */
  onSeeAll?: (q: string) => void;
  /** Live top matches rendered under suggestions (Home) — tappable rows. */
  topResults?: Paper[];
  onOpenPaper?: (p: Paper) => void;
  papers?: Paper[];
  subjectNames?: string[];
  courseNames?: string[];
  placeholder?: string;
  autoFocus?: boolean;
  accessibilityLabel?: string;
}) {
  const c = useThemeColors();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [debounced, setDebounced] = useState(value);
  const [hint, setHint] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), 150);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  // Idle typewriter: type, hold, erase, next hint. Async callbacks only.
  useEffect(() => {
    if (value || focused || reduceMotion) return;
    let hi = 0;
    let ci = 0;
    let deleting = false;
    let t: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      const full = IDLE_HINTS[hi % IDLE_HINTS.length]!;
      if (!deleting) {
        ci += 1;
        setHint(full.slice(0, ci));
        if (ci >= full.length) {
          deleting = true;
          t = setTimeout(step, 1500);
          return;
        }
        t = setTimeout(step, 45);
      } else {
        ci -= 1;
        setHint(full.slice(0, ci));
        if (ci <= 0) {
          deleting = false;
          hi += 1;
          t = setTimeout(step, 400);
          return;
        }
        t = setTimeout(step, 18);
      }
    };
    t = setTimeout(step, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value, focused, reduceMotion]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = debounced.trim().toLowerCase();
    if (q.length < MIN_LENGTH) return [];
    const out: Suggestion[] = [];
    for (const p of papers) {
      if (out.length >= MAX_SUGGESTIONS) break;
      if (p.title.toLowerCase().includes(q)) out.push({ text: p.title, type: 'paper', icon: 'book' });
    }
    for (const s of subjectNames) {
      if (out.length >= MAX_SUGGESTIONS) break;
      if (s.toLowerCase().includes(q)) out.push({ text: s, type: 'subject', icon: 'grid' });
    }
    for (const cn of courseNames) {
      if (out.length >= MAX_SUGGESTIONS) break;
      if (cn.toLowerCase().includes(q)) out.push({ text: cn, type: 'course', icon: 'list' });
    }
    return out;
  }, [debounced, papers, subjectNames, courseNames]);

  const commit = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setOpen(false);
    onCommit(t);
  };

  const canSeeAll = !!onSeeAll && value.trim().length >= MIN_LENGTH;
  const showPanel = open && (suggestions.length > 0 || topResults.length > 0 || canSeeAll);

  const shownPlaceholder = value || focused || !hint ? placeholder : hint;

  return (
    <View style={{ position: 'relative', zIndex: 999, elevation: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.bgElevated,
          borderWidth: 1,
          borderColor: c.borderStrong,
          borderRadius: radii.card,
          paddingVertical: 10,
          paddingHorizontal: 14,
          gap: 8,
        }}
      >
        <Icon name="search" size={18} color={c.textQuiet} />
        <TextInput
          value={value}
          onChangeText={(v) => {
            onChange(v);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => {
              setOpen(false);
            }, 120);
          }}
          onSubmitEditing={() => commit(value)}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          placeholder={shownPlaceholder}
          placeholderTextColor={c.textQuiet}
          accessibilityLabel={accessibilityLabel}
          style={{ flex: 1, fontSize: 15, color: c.textPrimary, fontFamily: fonts.sans }}
        />
      </View>
      {showPanel ? (
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: c.bgElevated,
            borderWidth: 1,
            borderColor: c.borderDefault,
            borderRadius: radii.card,
            zIndex: 999,
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
            maxHeight: 340,
          }}
          contentContainerStyle={{ overflow: 'hidden', borderRadius: radii.card }}
        >
          {suggestions.map((s, si) => (
            <HapticPressable
              key={`${s.type}:${s.text}:${si}`}
              onPress={() => {
                onChange(s.text);
                commit(s.text);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Search ${s.text}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 48 }}
            >
              <Icon name={s.icon} size={14} color={c.textTertiary} />
              <Text
                numberOfLines={1}
                style={{ flex: 1, fontSize: 13.5, color: c.textPrimary, fontFamily: fonts.sans }}
              >
                {s.text}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: c.textQuiet,
                  backgroundColor: c.bgSkeleton,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 3,
                  fontFamily: fonts.sansMedium,
                }}
              >
                {s.type}
              </Text>
            </HapticPressable>
          ))}
          {topResults.length > 0 ? (
            <View>
              <Text
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 1.7,
                  fontWeight: '600',
                  color: c.textTertiary,
                  fontFamily: fonts.sansSemi,
                  paddingHorizontal: 14,
                  paddingTop: 12,
                  paddingBottom: 4,
                }}
              >
                Top results
              </Text>
              {topResults.map((p) => (
                <HapticPressable
                  key={`top-${p.id}`}
                  onPress={() => {
                    setOpen(false);
                    onOpenPaper?.(p);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${p.title}`}
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    alignItems: 'center',
                    minHeight: 64,
                  }}
                >
                  <IndexStack paper={p} size="xs" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <HighlightText text={p.title} query={value} fontSize={14} />
                    <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono, marginTop: 3 }}>
                      {p.type} · {p.year}
                    </Text>
                  </View>
                  <Icon name="chevron" size={14} color={c.textQuiet} />
                </HapticPressable>
              ))}
            </View>
          ) : null}
          {canSeeAll ? (
            <HapticPressable
              onPress={() => {
                setOpen(false);
                onSeeAll?.(value.trim());
              }}
              accessibilityRole="button"
              accessibilityLabel={`See all results for ${value.trim()}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 14,
                borderTopWidth: 1,
                borderTopColor: c.borderDefault,
                minHeight: 52,
                backgroundColor: c.bgDefault,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
                See all results →
              </Text>
            </HapticPressable>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}
