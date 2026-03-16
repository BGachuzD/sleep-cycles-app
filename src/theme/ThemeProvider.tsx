import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  resolveAutoThemeByHour,
  themes,
  type AppTheme,
  type ThemeMode,
} from './theme';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('auto');

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
    [resolvedTheme, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
