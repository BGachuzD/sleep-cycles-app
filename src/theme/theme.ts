export type ThemeName = 'light' | 'dark';
export type ThemeMode = ThemeName | 'auto';

export type AccentScale = {
  50: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  heroText: string; // Reloj/displays gigantes (hero clocks). Usa violeta en light.
  primary: string;
  primaryStrong: string;
  accent: AccentScale;
  success: string;
  warning: string;
  danger: string;
  info: string;
  overlay: string;
  white: string;
  black: string;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

export const type = {
  caption: 11,
  micro: 12,
  small: 13,
  body: 14,
  bodyLarge: 15,
  subhead: 17,
  title3: 22,
  title2: 28,
  title1: 34,
  display: 52,
  hero: 64,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Type = typeof type;

export type AppTheme = {
  name: ThemeName;
  colors: ThemeColors;
  spacing: Spacing;
  radius: Radius;
  type: Type;
};

// Indigo scale dominante (refinada desde la paleta actual)
const indigoDark: AccentScale = {
  50: '#312e81',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
};

const indigoLight: AccentScale = {
  50: '#eef2ff',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
};

export const darkTheme: AppTheme = {
  name: 'dark',
  colors: {
    background: '#020617',
    surface: '#111827',
    surfaceElevated: '#1f2937',
    border: '#1f2937',
    textPrimary: '#e5e7eb',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    heroText: '#e5e7eb',
    primary: '#4f46e5',
    primaryStrong: '#6366f1',
    accent: indigoDark,
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',
    overlay: 'rgba(0,0,0,0.6)',
    white: '#ffffff',
    black: '#000000',
  },
  spacing,
  radius,
  type,
};

export const lightTheme: AppTheme = {
  name: 'light',
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#f1f5f9',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    heroText: '#4338ca',
    primary: '#4f46e5',
    primaryStrong: '#4338ca',
    accent: indigoLight,
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
    overlay: 'rgba(15,23,42,0.35)',
    white: '#ffffff',
    black: '#000000',
  },
  spacing,
  radius,
  type,
};

export const themes: Record<ThemeName, AppTheme> = {
  dark: darkTheme,
  light: lightTheme,
};

export function resolveAutoThemeByHour(date = new Date()): ThemeName {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}
