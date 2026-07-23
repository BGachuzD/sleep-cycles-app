import { Ionicons } from '@expo/vector-icons';
import React, { FC } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../hooks/usePressScale';
import { useAppTheme } from '../theme/ThemeProvider';

/**
 * Píldora de upsell inline. Aparece cuando un usuario gratuito toca el límite
 * de una función (más etiquetas, nota más larga, etc.) y, al tocarla, presenta
 * el paywall. Es la contraparte "suave" del gating: no oculta la función, la
 * topa y ofrece desbloquearla.
 */
export const PremiumHint: FC<{ label: string; onPress: () => void }> = ({
  label,
  onPress,
}) => {
  const { theme } = useAppTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);

  return (
    <Animated.View style={[{ alignSelf: 'flex-start' }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.pill,
          {
            backgroundColor: `${theme.colors.accent[500]}14`,
            borderColor: `${theme.colors.accent[500]}40`,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Ionicons name="sparkles" size={12} color={theme.colors.accent[400]} />
        <Text
          style={[
            styles.text,
            { color: theme.colors.accent[300], fontSize: theme.type.caption },
          ]}
        >
          {label}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={12}
          color={theme.colors.accent[400]}
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  text: { fontWeight: '700', letterSpacing: 0.2 },
});
