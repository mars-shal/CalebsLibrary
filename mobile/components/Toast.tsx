// Toast — bottom-above-tabs transient notices (copied link, saved, queued).
// Zustand-backed so any module can fire without prop drilling.
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { create } from 'zustand';
import { fonts, radii } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';

interface ToastState {
  message: string | null;
  key: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  key: 0,
  show: (message) =>
    set((s) => {
      setTimeout(() => useToastStore.getState().hide(), 2200);
      return { message, key: s.key + 1 };
    }),
  hide: () => set({ message: null }),
}));

export function toast(message: string): void {
  useToastStore.getState().show(message);
}

export function ToastHost() {
  const c = useThemeColors();
  const message = useToastStore((s) => s.message);
  const key = useToastStore((s) => s.key);
  if (!message) return null;
  return (
    <View
      style={{ position: 'absolute', left: 20, right: 20, bottom: 110, alignItems: 'center', zIndex: 100, pointerEvents: 'none' }}
    >
      <Animated.View
        key={key}
        entering={FadeInDown.duration(200)}
        exiting={FadeOutDown.duration(200)}
        accessibilityRole="alert"
        style={{
          backgroundColor: c.textPrimary,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: radii.pill,
          maxWidth: '100%',
        }}
      >
        <Text style={{ color: c.bgDefault, fontSize: 13, fontWeight: '500', fontFamily: fonts.sansMedium, textAlign: 'center' }}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}
