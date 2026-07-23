import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme, ThemeMode } from '../../theme/theme';

// ─────────────────────────────────────────────
// ThemeOption
// ─────────────────────────────────────────────
export const ThemeOption: FC<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, description, icon, selected, onPress, theme }) => {
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
          optionStyles.option,
          {
            backgroundColor: selected
              ? `${theme.colors.accent[500]}14`
              : theme.colors.surface,
            borderColor: selected
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: selected ? 1.5 : 1,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View
          style={[
            optionStyles.iconCircle,
            {
              backgroundColor: selected
                ? theme.colors.accent[500]
                : `${theme.colors.accent[500]}1F`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={selected ? theme.colors.white : theme.colors.accent[400]}
          />
        </View>

        <View style={optionStyles.textCol}>
          <Text
            style={[
              optionStyles.label,
              {
                color: selected
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
              optionStyles.description,
              { color: theme.colors.textMuted, fontSize: theme.type.small },
            ]}
          >
            {description}
          </Text>
        </View>

        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.accent[400]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const optionStyles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  label: { fontWeight: '700' },
  description: { lineHeight: 17, marginTop: 2 },
});
