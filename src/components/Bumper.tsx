import React, { FC } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../hooks/usePressScale';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  accessibilityLabel?: string;
};

/**
 * Botón circular con spring scale on press, fondo violeta tenue.
 * Útil para incrementar/decrementar valores numéricos en pickers
 * y forms (hora, minutos, etc.).
 */
export const Bumper: FC<Props> = ({
  icon,
  onPress,
  size = 36,
  iconSize = 20,
  accessibilityLabel,
}) => {
  const { theme } = useAppTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.85);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        style={[
          styles.btn,
          {
            width: size,
            height: size,
            backgroundColor: `${theme.colors.accent[500]}1A`,
            borderRadius: size / 2,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={iconSize}
          color={theme.colors.accent[400]}
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
