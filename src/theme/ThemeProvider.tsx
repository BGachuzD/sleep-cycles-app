import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { logger } from '@/lib/logger';

import {
  type AppTheme,
  resolveAutoThemeByHour,
  type ThemeMode,
  themes,
} from './theme';

const STORAGE_KEY = 'themeMode/v1';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isValidMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto';
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Por defecto oscuro: es una app de sueño que se usa de noche.
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && isValidMode(raw)) {
          setModeState(raw);
        }
      } catch (err) {
        logger.warn('Error loading theme mode from storage', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((err) => {
      logger.warn('Error persisting theme mode', err);
    });
  }, []);

  const resolvedTheme = useMemo(() => {
    const resolvedName = mode === 'auto' ? resolveAutoThemeByHour() : mode;
    return themes[resolvedName];
  }, [mode]);

  const value = useMemo(
    () => ({
      theme: resolvedTheme,
      mode,
      setMode,
    }),
    [resolvedTheme, mode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useAppTheme(): ThemeContextValue {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
