import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';
import { formatTime } from '../../utils/sleep';

// ─────────────────────────────────────────────
// TimeField: tarjeta tocable que muestra la hora;
// al tocarla se abre la rueda nativa debajo.
// ─────────────────────────────────────────────
export const TimeField: FC<{
  label: string;
  date: Date;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, date, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatTime(date)}. Toca para cambiar la hora`}
        style={[
          timeStyles.column,
          {
            backgroundColor: active
              ? `${theme.colors.accent[500]}14`
              : theme.colors.surfaceElevated,
            borderRadius: theme.radius.lg,
            borderColor: active
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            timeStyles.label,
            { color: theme.colors.textMuted, fontSize: theme.type.micro },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            timeStyles.value,
            { color: theme.colors.heroText, fontSize: theme.type.title2 },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {formatTime(date)}
        </Text>
        <View style={timeStyles.hintRow}>
          <Ionicons
            name={active ? 'chevron-up' : 'create-outline'}
            size={12}
            color={active ? theme.colors.accent[400] : theme.colors.textMuted}
          />
          <Text
            style={[
              timeStyles.hint,
              {
                color: active
                  ? theme.colors.accent[400]
                  : theme.colors.textMuted,
                fontSize: theme.type.caption,
              },
            ]}
          >
            {active ? 'Cerrar' : 'Editar'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const timeStyles = StyleSheet.create({
  column: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  label: { fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  value: {
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hint: { fontWeight: '700', letterSpacing: 0.3 },
});
