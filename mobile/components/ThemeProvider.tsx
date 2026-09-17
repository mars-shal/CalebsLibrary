// ThemeProvider — async theme init (light/dark/system) backed by MMKV.
// RULE: init reads storage before first paint; NEVER a render side-effect
// like the web TopStrip setup-time applyTheme.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getKV, type KV } from '@/lib/storage';
import { light, dark, type Theme } from '../theme/tokens';

export type ThemeChoice = 'light' | 'dark' | 'system';

const storage: KV = getKV('calebs-settings');
const THEME_KEY = 'calebs_theme_choice';

const ThemeContext = createContext<{ theme: Theme; scheme: 'light' | 'dark'; choice: ThemeChoice; setChoice: (c: ThemeChoice) => void }>({
  theme: light,
  scheme: 'light',
  choice: 'system',
  setChoice: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemRaw = useColorScheme();
  const system: 'light' | 'dark' = systemRaw === 'dark' ? 'dark' : 'light';
  const [choice, setChoiceState] = useState<ThemeChoice>(() => {
    const stored = storage.getString(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  });

  const scheme = choice === 'system' ? system : choice;
  const value = useMemo(
    () => ({
      theme: scheme === 'dark' ? dark : light,
      scheme,
      choice,
      setChoice: (c: ThemeChoice) => {
        storage.set(THEME_KEY, c);
        setChoiceState(c);
      },
    }),
    [scheme, choice],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): Theme {
  return useContext(ThemeContext).theme;
}

export function useThemeScheme(): 'light' | 'dark' {
  return useContext(ThemeContext).scheme;
}

export function useThemeChoice() {
  const { choice, setChoice } = useContext(ThemeContext);
  return { choice, setChoice };
}
