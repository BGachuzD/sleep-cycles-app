import React, { FC } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../hooks/usePressScale';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
};

/**
 * CTA principal de la app: botón gradient violeta full-width con sombra
 * de marca, icono leading, label y chevron trailing. Spring scale on press.
 */
export const PrimaryCTA: FC<Props> = ({
  label,
  icon,
  onPress,
  trailingIcon = 'chevron-forward',
}) => {
  const { theme } = useAppTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.96);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={[theme.colors.accent[500], theme.colors.accent[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.container,
            {
              borderRadius: theme.radius.xl,
              paddingHorizontal: theme.spacing.xl,
              shadowColor: theme.colors.accent[600],
            },
          ]}
        >
          <Ionicons name={icon} size={22} color={theme.colors.white} />
          <Text style={[styles.label, { fontSize: theme.type.subhead }]}>
            {label}
          </Text>
          <Ionicons name={trailingIcon} size={20} color={theme.colors.white} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  label: { color: '#ffffff', fontWeight: '700', flex: 1 },
});
