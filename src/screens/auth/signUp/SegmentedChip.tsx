import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../../hooks/usePressScale';
import type { AppTheme } from '../../../theme/theme';

// ─────────────────────────────────────────────
// SegmentedChip (inline para cronotipo)
// ─────────────────────────────────────────────
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
          active && { backgroundColor: theme.colors.accent[500] },
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
