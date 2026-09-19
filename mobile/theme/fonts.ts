// Font loading — Hanken Grotesk (brand wordmark) + Fraunces (editorial serif)
// + General Sans (UI body) + JetBrains Mono (meta).
// Offline-safe: families bundle via expo-font; UI falls back to system serif/
// system/monospace until loaded (never blocks first paint on cache).
import { useFonts } from 'expo-font';
import {
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import HankenGroteskMedium from '../assets/fonts/HankenGrotesk-Medium.ttf';
import HankenGroteskSemiBold from '../assets/fonts/HankenGrotesk-SemiBold.ttf';
import GeneralSansRegular from '../assets/fonts/GeneralSans-Regular.ttf';
import GeneralSansMedium from '../assets/fonts/GeneralSans-Medium.ttf';
import GeneralSansSemibold from '../assets/fonts/GeneralSans-Semibold.ttf';

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    'HankenGrotesk-Medium': HankenGroteskMedium,
    'HankenGrotesk-SemiBold': HankenGroteskSemiBold,
    Fraunces_500Medium,
    Fraunces_500Medium_Italic,
    'GeneralSans-Regular': GeneralSansRegular,
    'GeneralSans-Medium': GeneralSansMedium,
    'GeneralSans-Semibold': GeneralSansSemibold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  return loaded;
}
