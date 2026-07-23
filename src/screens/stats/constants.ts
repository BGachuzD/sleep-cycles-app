import { Ionicons } from '@expo/vector-icons';

// Feelings (mismo lenguaje que SleepLog)
export type FeelingLevel = 1 | 2 | 3;

export const UNDER_TARGET_COLOR = '#F7E950';

export const FEELING_ICON: Record<
  FeelingLevel,
  {
    icon: keyof typeof Ionicons.glyphMap;
    colorKey: 'danger' | 'warning' | 'success';
  }
> = {
  1: { icon: 'cloud-outline', colorKey: 'danger' },
  2: { icon: 'partly-sunny-outline', colorKey: 'warning' },
  3: { icon: 'sunny-outline', colorKey: 'success' },
};
