import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';

export const SegmentedChip: FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, icon, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.96);
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          segmentedStyles.chip,
          active && {
            backgroundColor: theme.colors.accent[500],
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={15}
          color={active ? theme.colors.white : theme.colors.textSecondary}
        />
        <Text
          style={[
            segmentedStyles.label,
            {
              color: active ? theme.colors.white : theme.colors.textSecondary,
              fontSize: theme.type.small,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const segmentedStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
  },
  label: { fontWeight: '700' },
});

// ─────────────────────────────────────────────
// SegmentedChips genérico
// ─────────────────────────────────────────────
export function SegmentedChips<T extends string>({
  options,
  value,
  onChange,
  theme,
}: {
  options: {
    value: T;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[];
  value: T;
  onChange: (v: T) => void;
  theme: AppTheme;
}) {
  return (
    <View
      style={[
        segmentedStyles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: 999,
        },
      ]}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <SegmentedChip
            key={opt.value}
            label={opt.label}
            icon={opt.icon}
            active={active}
            onPress={() => onChange(opt.value)}
            theme={theme}
          />
        );
      })}
    </View>
  );
}
