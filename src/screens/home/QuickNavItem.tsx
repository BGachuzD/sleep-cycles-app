import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// QuickNavItem: card pequeño tap-able con spring
// ─────────────────────────────────────────────
export const QuickNavItem: FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, icon, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.93);
  return (
    <Animated.View style={[{ width: '47%' }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          quickStyles.item,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={theme.colors.accent[400]} />
        <Text
          style={[
            quickStyles.label,
            { color: theme.colors.textPrimary, fontSize: theme.type.small },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const quickStyles = StyleSheet.create({
  item: { alignItems: 'flex-start', gap: 10, borderWidth: 1 },
  label: { fontWeight: '700' },
});
