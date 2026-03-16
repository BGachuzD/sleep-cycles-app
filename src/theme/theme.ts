export type ThemeName = 'light' | 'dark';
export type ThemeMode = ThemeName | 'auto';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryStrong: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  overlay: string;
  white: string;
  black: string;
};

export type AppTheme = {
  name: ThemeName;
  colors: ThemeColors;
};

export const darkTheme: AppTheme = {
  name: 'dark',
  colors: {
    background: '#020617',
    surface: '#1f2937',
    surfaceElevated: '#334155',
    border: '#374151',
    textPrimary: '#e5e7eb',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    primary: '#4f46e5',
    primaryStrong: '#6366f1',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',
    overlay: 'rgba(0,0,0,0.6)',
    white: '#ffffff',
    black: '#000000',
  },
};

export const lightTheme: AppTheme = {
  name: 'light',
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#e2e8f0',
    border: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    primary: '#4f46e5',
    primaryStrong: '#4338ca',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
    overlay: 'rgba(15,23,42,0.35)',
    white: '#ffffff',
    black: '#000000',
  },
};

export const themes: Record<ThemeName, AppTheme> = {
  dark: darkTheme,
  light: lightTheme,
};

export function resolveAutoThemeByHour(date = new Date()): ThemeName {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}
