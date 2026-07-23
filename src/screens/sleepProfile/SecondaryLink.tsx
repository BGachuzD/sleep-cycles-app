import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// SecondaryLink (link discreto en sección de acciones)
// ─────────────────────────────────────────────
export const SecondaryLink: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  theme: AppTheme;
}> = ({ icon, label, onPress, destructive, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  const color = destructive ? theme.colors.danger : theme.colors.textSecondary;
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        style={[
          linkStyles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: destructive
              ? `${theme.colors.danger}33`
              : theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[linkStyles.label, { color, fontSize: theme.type.body }]}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={color} />
      </Pressable>
    </Animated.View>
  );
};

const linkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  label: { fontWeight: '700', flex: 1 },
});
