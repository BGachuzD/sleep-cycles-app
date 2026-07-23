import { FC } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// DayChip: selector de a qué día pertenece el registro
// (la fecha es la del DESPERTAR: "Hoy" = desperté esta mañana)
// ─────────────────────────────────────────────
export const DayChip: FC<{
  label: string;
  dateCaption: string;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, dateCaption, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.95);
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Registrar despertar de ${label}`}
        style={[
          dayStyles.chip,
          {
            backgroundColor: active
              ? `${theme.colors.accent[500]}1F`
              : theme.colors.surfaceElevated,
            borderColor: active
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Text
          style={[
            dayStyles.label,
            {
              color: active
                ? theme.colors.accent[300]
                : theme.colors.textSecondary,
              fontSize: theme.type.small,
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            dayStyles.caption,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          {dateCaption}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const dayStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  label: { fontWeight: '700' },
  caption: { fontWeight: '600' },
});
