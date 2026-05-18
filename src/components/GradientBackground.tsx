import React, { FC, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useAppTheme } from '../theme/ThemeProvider';

const { width, height } = Dimensions.get('window');

const GLOW_DIAMETER = Math.max(width, height) * 1.2;

export const GradientBackground: FC = () => {
  const { theme } = useAppTheme();
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [0.35, 0.6]),
    transform: [{ scale: interpolate(breath.value, [0, 1], [0.95, 1.05]) }],
  }));

  const glowColor = theme.name === 'dark'
    ? theme.colors.accent[600]
    : theme.colors.accent[400];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: glowColor,
            shadowColor: glowColor,
          },
          glowStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -GLOW_DIAMETER * 0.45,
    left: (width - GLOW_DIAMETER) / 2,
    width: GLOW_DIAMETER,
    height: GLOW_DIAMETER,
    borderRadius: GLOW_DIAMETER / 2,
    opacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 200,
  },
});
