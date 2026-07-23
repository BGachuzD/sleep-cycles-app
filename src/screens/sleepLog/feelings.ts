import { Ionicons } from '@expo/vector-icons';

// ─────────────────────────────────────────────
// Feelings: 1 Mal · 2 Regular · 3 Excelente
// Iconos meteorológicos + colores semánticos del theme.
// ─────────────────────────────────────────────
export type FeelingLevel = 1 | 2 | 3;

export const FEELINGS: Record<
  FeelingLevel,
  {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    colorKey: 'danger' | 'warning' | 'success';
  }
> = {
  1: { icon: 'cloud-outline', label: 'Mal', colorKey: 'danger' },
  2: { icon: 'partly-sunny-outline', label: 'Regular', colorKey: 'warning' },
  3: { icon: 'sunny-outline', label: 'Excelente', colorKey: 'success' },
};
