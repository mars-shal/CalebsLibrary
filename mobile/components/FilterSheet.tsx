// FilterSheet — Browse filters in ONE bottom sheet (replaces the web
// filter-bar + selects). Subject single-select + All, course chips scoped to
// the subject, type pills, year steppers, 6 sorts, reset.
import { ScrollView, Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { Sheet } from './Sheet';
import { Eyebrow, SortList, TypePills, YearStepper } from './filterbits';
import { fonts, radii } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import type { FacetCourse, FacetSubject } from '../lib/queries';

export type BrowseSort = 'dept' | 'course' | 'year-new' | 'year-old' | 'reads' | 'upvotes';

export const BROWSE_SORTS: { id: BrowseSort; label: string }[] = [
  { id: 'dept', label: 'Department' },
  { id: 'course', label: 'Course' },
  { id: 'year-new', label: 'Year (newest)' },
  { id: 'year-old', label: 'Year (oldest)' },
  { id: 'reads', label: 'Most read' },
  { id: 'upvotes', label: 'Most upvoted' },
];

export interface BrowseFilters {
  subject: string; // 'all' | subjectId
  course: string; // 'all' | courseId
  types: string[];
  yearMin: number;
  yearMax: number;
  sort: BrowseSort;
}

export function FilterSheet({
  visible,
  onClose,
  filters,
  onChange,
  onReset,
  subjects,
  courses,
  yearBounds,
}: {
  visible: boolean;
  onClose: () => void;
  filters: BrowseFilters;
  onChange: (f: BrowseFilters) => void;
  onReset: () => void;
  subjects: FacetSubject[];
  courses: FacetCourse[];
  yearBounds: { min: number; max: number };
}) {
  const c = useThemeColors();
  const scopedCourses = courses.filter(
    (x) => filters.subject === 'all' || x.subjectId === filters.subject,
  );
  const set = (p: Partial<BrowseFilters>) => onChange({ ...filters, ...p });

  return (
    <Sheet visible={visible} onClose={onClose} title="Filter shelves">
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
        <Eyebrow>Department</Eyebrow>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {[{ id: 'all', name: 'All departments' }, ...subjects].map((s) => {
            const active = filters.subject === s.id;
            return (
              <HapticPressable
                key={s.id}
                onPress={() => set({ subject: s.id, course: 'all' })}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={s.name}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: active ? radii.pill : 4,
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
                  {s.name}
                </Text>
              </HapticPressable>
            );
          })}
        </View>

        <Eyebrow>Course</Eyebrow>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {[{ id: 'all', displayName: 'All courses' }, ...scopedCourses].map((x) => {
            const active = filters.course === x.id;
            return (
              <HapticPressable
                key={x.id}
                onPress={() => set({ course: x.id })}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={x.displayName}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: active ? radii.pill : 4,
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
                  {x.displayName}
                </Text>
              </HapticPressable>
            );
          })}
        </View>

        <Eyebrow>Type</Eyebrow>
        <View style={{ marginBottom: 24 }}>
          <TypePills
            selected={filters.types}
            onToggle={(t) =>
              set({
                types: filters.types.includes(t)
                  ? filters.types.filter((x) => x !== t)
                  : [...filters.types, t],
              })
            }
          />
        </View>

        <Eyebrow>Year</Eyebrow>
        <View style={{ marginBottom: 24, gap: 4 }}>
          <YearStepper
            label="From"
            value={filters.yearMin}
            min={yearBounds.min}
            max={filters.yearMax}
            onChange={(v) => set({ yearMin: Math.min(v, filters.yearMax) })}
          />
          <YearStepper
            label="To"
            value={filters.yearMax}
            min={filters.yearMin}
            max={yearBounds.max}
            onChange={(v) => set({ yearMax: Math.max(v, filters.yearMin) })}
          />
        </View>

        <Eyebrow>Sort shelves</Eyebrow>
        <SortList options={BROWSE_SORTS} value={filters.sort} onChange={(sort) => set({ sort })} />

        <HapticPressable
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="Reset all filters"
          style={{ alignSelf: 'flex-start', paddingVertical: 14, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>
            Reset all filters
          </Text>
        </HapticPressable>
      </ScrollView>
    </Sheet>
  );
}
