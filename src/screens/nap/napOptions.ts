import { Ionicons } from '@expo/vector-icons';

import type { AppTheme } from '../../theme/theme';

export type NapColorKey = 'success' | 'warning' | 'accent500' | 'accent700';

export interface NapOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  durationMinutes: number;
  shortDesc: string;
  longDesc: string;
  colorKey: NapColorKey;
  tip: string;
  highlight?: boolean;
}

export const NAP_OPTIONS: NapOption[] = [
  {
    id: 'power',
    label: 'Power Nap',
    icon: 'flash-outline',
    durationMinutes: 20,
    shortDesc: 'Recarga rápida sin inercia de sueño.',
    longDesc:
      'No entras en sueño profundo. Despertarás sin aturdimiento y con mayor alerta inmediata.',
    colorKey: 'success',
    tip: 'Ideal antes de las 3pm para no afectar tu sueño nocturno.',
  },
  {
    id: 'refresh',
    label: 'Siesta de recuperación',
    icon: 'cafe-outline',
    durationMinutes: 60,
    shortDesc: 'Un ciclo parcial. Posible inercia leve al despertar.',
    longDesc:
      'Entras a fases más profundas. Despertar puede sentirse pesado los primeros minutos, pero ayuda con fatiga acumulada.',
    colorKey: 'warning',
    tip: 'Útil si tienes una o dos horas. Considera 10 min para "arrancar" tras despertar.',
  },
  {
    id: 'full',
    label: 'Ciclo completo',
    icon: 'moon-outline',
    durationMinutes: 90,
    shortDesc: 'Un ciclo de sueño completo. Recuperación cognitiva alta.',
    longDesc:
      'Completas un ciclo de ~90 min, terminando en sueño ligero. Es la opción con mejor balance recuperación-inercia.',
    colorKey: 'accent500',
    tip: 'La más recomendada cuando tienes el tiempo. Despierta en fase ligera, fresco.',
    highlight: true,
  },
  {
    id: 'double',
    label: 'Doble ciclo',
    icon: 'bed-outline',
    durationMinutes: 180,
    shortDesc: 'Dos ciclos completos. Para deuda significativa.',
    longDesc:
      'Dos ciclos seguidos. Recuperación profunda, usa solo si necesitas compensar mala noche o si no dormiste suficiente.',
    colorKey: 'accent700',
    tip: 'Evita después de las 4pm, podría desplazar tu sueño nocturno.',
  },
];

export function resolveColor(theme: AppTheme, key: NapColorKey): string {
  switch (key) {
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'accent500':
      return theme.colors.accent[500];
    case 'accent700':
      return theme.colors.accent[700];
  }
}
