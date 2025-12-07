// src/components/GradientBackground.tsx
import React, { FC, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { MoonIcon } from '../icons/moon';

const { width, height } = Dimensions.get('window');

export const GradientBackground: FC = () => {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 8000 }),
      -1,
      true
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => {
    const translateY = -40 + glow.value * 80;
    const translateX = -20 + glow.value * 40;

    return {
      transform: [
        { translateY },
        { translateX },
        { scale: 1.1 + glow.value * 0.15 },
      ],
      opacity: 0.4 + glow.value * 0.3,
    };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#020617', '#020617', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.glow, glowStyle]}>
  <View style={styles.moonInner}>
    <MoonIcon size={width * 0.5} color="#fff" opacity={0.3} />
  </View>
</Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: height * 0.55,
    left: width * 0.1,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width,
    // backgroundColor: '#fff',
    opacity: 0.95,
  },
  moonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});