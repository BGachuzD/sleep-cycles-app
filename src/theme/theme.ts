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
  surfaceSecondary: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  heroText: string;
  primary: string;
  primaryStrong: string;
  violet: string;
  blue: string;
  accent: AccentScale;
  success: string;
  warning: string;
  danger: string;
  info: string;
  overlay: string;
  white: string;
  black: string;
};

/** Escala única de 4 px para toda la aplicación. */
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

/** Radios orgánicos. `full` se reserva para cápsulas y círculos. */
export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  xxl: 32,
  full: 999,
} as const;

export const type = {
  caption: 12,
  micro: 12,
  small: 13,
  body: 15,
  bodyLarge: 15,
  subhead: 16,
  title3: 20,
  title2: 28,
  title1: 34,
  display: 52,
  hero: 64,
} as const;

export const lineHeight = {
  caption: 16,
  small: 18,
  body: 21,
  subhead: 22,
  title3: 26,
  title2: 34,
  title1: 40,
} as const;

export const motion = {
  pressScale: 0.96,
  fast: 160,
  standard: 220,
  deliberate: 280,
} as const;

export const shadows = {
  soft: '0 8px 28px rgba(0, 0, 0, 0.20)',
  elevated: '0 14px 40px rgba(0, 0, 0, 0.28)',
  accent: '0 12px 32px rgba(99, 102, 241, 0.22)',
  floating: '0 10px 30px rgba(0, 0, 0, 0.34)',
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Type = typeof type;
export type LineHeight = typeof lineHeight;
export type Motion = typeof motion;
export type Shadows = typeof shadows;

export type AppTheme = {
  name: ThemeName;
  colors: ThemeColors;
  spacing: Spacing;
  radius: Radius;
  type: Type;
  lineHeight: LineHeight;
  motion: Motion;
  shadows: Shadows;
};

const darkAccent: AccentScale = {
  50: '#1E2454',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1',
  600: '#4F46E5',
  700: '#4338CA',
};

const lightAccent: AccentScale = {
  50: '#EEF2FF',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1',
  600: '#4F46E5',
  700: '#4338CA',
};

export const darkTheme: AppTheme = {
  name: 'dark',
  colors: {
    background: '#121620',
    surface: '#1A202C',
    surfaceElevated: '#222A38',
    surfaceSecondary: '#2B3546',
    border: 'rgba(255,255,255,0.09)',
    borderStrong: 'rgba(255,255,255,0.15)',
    textPrimary: '#F7F7FA',
    textSecondary: '#A5A5B2',
    textMuted: '#72727F',
    heroText: '#F7F7FA',
    primary: '#6366F1',
    primaryStrong: '#4F46E5',
    violet: '#A78BFA',
    blue: '#6FC8FF',
    accent: darkAccent,
    success: '#72D6A5',
    warning: '#F2C879',
    danger: '#FF8A9B',
    info: '#6FC8FF',
    overlay: 'rgba(5,5,8,0.78)',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing,
  radius,
  type,
  lineHeight,
  motion,
  shadows,
};

export const lightTheme: AppTheme = {
  name: 'light',
  colors: {
    background: '#F7F5F8',
    surface: '#FFFFFF',
    surfaceElevated: '#F1EEF4',
    surfaceSecondary: '#E9E5ED',
    border: 'rgba(31,24,38,0.08)',
    borderStrong: 'rgba(31,24,38,0.14)',
    textPrimary: '#17131A',
    textSecondary: '#625B68',
    textMuted: '#89828E',
    heroText: '#5F42B5',
    primary: '#6366F1',
    primaryStrong: '#4F46E5',
    violet: '#8B6DE5',
    blue: '#399FD9',
    accent: lightAccent,
    success: '#25875C',
    warning: '#A86A16',
    danger: '#C9485F',
    info: '#287EAB',
    overlay: 'rgba(18,13,22,0.42)',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing,
  radius,
  type,
  lineHeight,
  motion,
  shadows,
};

export const themes: Record<ThemeName, AppTheme> = {
  dark: darkTheme,
  light: lightTheme,
};

export function resolveAutoThemeByHour(date = new Date()): ThemeName {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}
