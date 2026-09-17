// Font loading — EB Garamond (brand only) + Inter (UI) + JetBrains Mono (meta).
// Offline-safe: families bundle via expo-font; UI falls back to system serif/
// system/monospace until loaded (never blocks first paint on cache).
import {
  useFonts,
  EBGaramond_500Medium,
  EBGaramond_500Medium_Italic,
} from '@expo-google-fonts/eb-garamond';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    EBGaramond_500Medium,
    EBGaramond_500Medium_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  return loaded;
}
