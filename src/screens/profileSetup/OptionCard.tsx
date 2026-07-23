import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// Tarjeta de opción (cronotipo)
// ─────────────────────────────────────────────
export const OptionCard: FC<{
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, desc, icon, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          optionStyles.card,
          {
            backgroundColor: active
              ? `${theme.colors.accent[500]}14`
              : theme.colors.surface,
            borderColor: active
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View
          style={[
            optionStyles.iconCircle,
            { backgroundColor: `${theme.colors.accent[500]}1F` },
          ]}
        >
          <Ionicons name={icon} size={20} color={theme.colors.accent[400]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              optionStyles.label,
              {
                color: active
                  ? theme.colors.textPrimary
                  : theme.colors.textSecondary,
                fontSize: theme.type.bodyLarge,
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              optionStyles.desc,
              { color: theme.colors.textMuted, fontSize: theme.type.small },
            ]}
          >
            {desc}
          </Text>
        </View>
        {active && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={theme.colors.accent[400]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const optionStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700' },
  desc: { lineHeight: 16, marginTop: 2 },
});
