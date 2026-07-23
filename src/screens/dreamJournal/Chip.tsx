import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';
import { styles } from './styles';

export const Chip: FC<{
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  color?: string;
  grow?: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, icon, active, color, grow, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.95);
  const c = color ?? theme.colors.accent[500];
  return (
    <Animated.View style={[grow ? { flex: 1 } : null, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.chip,
          {
            backgroundColor: active ? `${c}1F` : theme.colors.surfaceElevated,
            borderColor: active ? c : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={16}
            color={active ? c : theme.colors.textMuted}
          />
        )}
        <Text
          style={[
            styles.chipLabel,
            { color: active ? c : theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
