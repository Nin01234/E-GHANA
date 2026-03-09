import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof Colors.light;
};

const STORAGE_KEY = 'theme_mode_v1';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // ignore
    });
  };

  const isDark = useMemo(() => {
    const scheme: ColorSchemeName = systemScheme || 'light';
    if (mode === 'system') return scheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const colors = isDark ? Colors.dark : Colors.light;

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isDark,
      colors,
    }),
    [mode, isDark, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

