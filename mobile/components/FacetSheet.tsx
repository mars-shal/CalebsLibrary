// FacetSheet — Search facets in ONE bottom sheet. Subject multi-select with
// counts (top 12 + see-all), type multi-select, year steppers, reset.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Sheet } from './Sheet';
import { Eyebrow, TypePills, YearStepper } from './filterbits';
import { fonts, radii } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import type { FacetSubject } from '../lib/queries';

export interface SearchFacets {
  subjects: string[];
  types: string[];
  yearMin: number;
  yearMax: number;
}

export function FacetSheet({
  visible,
  onClose,
  facets,
  onChange,
  onReset,
  subjects,
  yearBounds,
}: {
  visible: boolean;
  onClose: () => void;
  facets: SearchFacets;
  onChange: (f: SearchFacets) => void;
  onReset: () => void;
  subjects: FacetSubject[];
  yearBounds: { min: number; max: number };
}) {
  const c = useThemeColors();
  const [showAll, setShowAll] = useState(false);
  const listed = showAll ? subjects : subjects.slice(0, 12);
  const set = (p: Partial<SearchFacets>) => onChange({ ...facets, ...p });
  const toggleSubject = (id: string) =>
    set({
      subjects: facets.subjects.includes(id)
        ? facets.subjects.filter((s) => s !== id)
        : [...facets.subjects, id],
    });

  return (
    <Sheet visible={visible} onClose={onClose} title="Filters">
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
        <Eyebrow>Subject</Eyebrow>
        <View style={{ marginBottom: 8 }}>
          {listed.map((s) => {
            const active = facets.subjects.includes(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => toggleSubject(s.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${s.name}, ${s.count} papers`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 11,
                  minHeight: 44,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: active ? c.ink100 : c.ruleStrong,
                    backgroundColor: active ? c.ink100 : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {active ? (
                    <Text style={{ color: c.paper, fontSize: 12, fontWeight: '700' }}>✓</Text>
                  ) : null}
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans }}>
                  {s.name}
                </Text>
                <Text style={{ fontSize: 11, color: c.textQuiet, fontFamily: fonts.mono }}>
                  {s.count}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {subjects.length > 12 ? (
          <Pressable
            onPress={() => setShowAll(!showAll)}
            accessibilityRole="button"
            accessibilityLabel={showAll ? 'Show fewer subjects' : 'Show all subjects'}
            style={{ paddingVertical: 12, minHeight: 44, justifyContent: 'center', marginBottom: 16 }}
          >
            <Text style={{ fontSize: 13, color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              {showAll ? 'Show fewer ↑' : `See all ${subjects.length} subjects ↓`}
            </Text>
          </Pressable>
        ) : (
          <View style={{ height: 16 }} />
        )}

        <Eyebrow>Type</Eyebrow>
        <View style={{ marginBottom: 24 }}>
          <TypePills
            selected={facets.types}
            onToggle={(t) =>
              set({
                types: facets.types.includes(t)
                  ? facets.types.filter((x) => x !== t)
                  : [...facets.types, t],
              })
            }
          />
        </View>

        <Eyebrow>Year</Eyebrow>
        <View style={{ marginBottom: 16, gap: 4 }}>
          <YearStepper
            label="From"
            value={facets.yearMin}
            min={yearBounds.min}
            max={facets.yearMax}
            onChange={(v) => set({ yearMin: Math.min(v, facets.yearMax) })}
          />
          <YearStepper
            label="To"
            value={facets.yearMax}
            min={facets.yearMin}
            max={yearBounds.max}
            onChange={(v) => set({ yearMax: Math.max(v, facets.yearMin) })}
          />
        </View>

        <Pressable
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="Reset all filters"
          style={{ alignSelf: 'flex-start', paddingVertical: 14, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>
            Reset all filters
          </Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Show results"
          style={{
            marginTop: 8,
            backgroundColor: c.ink100,
            borderRadius: radii.card,
            paddingVertical: 14,
            alignItems: 'center',
            minHeight: 52,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: c.paper, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>
            Show results
          </Text>
        </Pressable>
      </ScrollView>
    </Sheet>
  );
}
