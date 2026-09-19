// Sheet — bottom sheet (filters, facets, details, report, share).
// v1: Modal + spring slide-up + backdrop fade. Drag-to-dismiss lands later;
// the close control is always present and labelled.
import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Icon } from '../icons/icons';
import { fonts, radii, spacing } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  accessibilityLabel?: string;
}

export function Sheet({ visible, onClose, title, children, accessibilityLabel }: SheetProps) {
  const c = useThemeColors();
  const scheme = useColorScheme() ?? 'light';
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(140)}
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
        />
        <Animated.View
          entering={SlideInDown.springify().damping(30).stiffness(300)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: scheme === 'dark' ? c.bgElevated : c.bgDefault,
            borderTopLeftRadius: radii.sheet,
            borderTopRightRadius: radii.sheet,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: c.borderDefault,
            paddingHorizontal: spacing.gutter,
            paddingTop: 12,
            paddingBottom: 32,
            maxHeight: '85%',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderStrong }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text
              style={{
                flex: 1,
                fontSize: 20,
                fontWeight: '500',
                color: c.textPrimary,
                fontFamily: fonts.sansMedium,
              }}
            >
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
              hitSlop={10}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="x" size={18} color={c.textSecondary} />
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
