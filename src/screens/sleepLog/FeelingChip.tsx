import { Ionicons } from '@expo/vector-icons';
import { FC, useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';
import { type FeelingLevel, FEELINGS } from './feelings';

export const FeelingChip: FC<{
  feeling: FeelingLevel;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ feeling, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.95);
  const info = FEELINGS[feeling];
  const color = theme.colors[info.colorKey];

  // Pop del icono al quedar seleccionado
  const iconScale = useSharedValue(1);
  useEffect(() => {
    if (active) {
      iconScale.value = withSequence(
        withSpring(1.3, { mass: 0.3, damping: 10, stiffness: 260 }),
        withSpring(1, { mass: 0.3, damping: 12, stiffness: 220 }),
      );
    }
  }, [active, iconScale]);
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={info.label}
        style={[
          feelingStyles.chip,
          {
            backgroundColor: active
              ? `${color}1F`
              : theme.colors.surfaceElevated,
            borderColor: active ? color : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons
            name={info.icon}
            size={24}
            color={active ? color : theme.colors.textMuted}
          />
        </Animated.View>
        <Text
          style={[
            feelingStyles.label,
            {
              color: active ? color : theme.colors.textSecondary,
              fontSize: theme.type.small,
            },
          ]}
        >
          {info.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const feelingStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  label: { fontWeight: '700' },
});
