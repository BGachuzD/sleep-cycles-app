import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { FC, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '../theme/ThemeProvider';

const HERO_SIZE = 116;

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
};

/**
 * Composición violeta con icono central y glow respirante.
 * Usado en SignIn/SignUp como elemento visual de bienvenida.
 */
export const AuthHero: FC<Props> = ({ icon }) => {
  const { theme } = useAppTheme();
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.value, [0, 1], [0.96, 1.06]) }],
    opacity: interpolate(breath.value, [0, 1], [0.5, 0.85]),
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: theme.colors.accent[500],
          },
          breathStyle,
        ]}
      />
      <View
        style={[
          styles.ring,
          {
            borderColor: `${theme.colors.accent[400]}55`,
            backgroundColor: `${theme.colors.accent[500]}1A`,
          },
        ]}
      />
      <LinearGradient
        colors={[theme.colors.accent[500], theme.colors.accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.inner, { boxShadow: theme.shadows.accent }]}
      >
        <Ionicons name={icon} size={40} color={theme.colors.white} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: HERO_SIZE * 1.4,
    height: HERO_SIZE * 1.4,
    borderRadius: HERO_SIZE,
    opacity: 0.3,
  },
  ring: {
    position: 'absolute',
    width: HERO_SIZE * 0.92,
    height: HERO_SIZE * 0.92,
    borderRadius: HERO_SIZE,
    borderWidth: 1,
  },
  inner: {
    width: HERO_SIZE * 0.62,
    height: HERO_SIZE * 0.62,
    borderRadius: HERO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
