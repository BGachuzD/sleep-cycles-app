import React, { type FC } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

/** Fondo oscuro con halos pastel muy sutiles; no compite con el contenido. */
export const GradientBackground: FC = () => {
  const { theme } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const diameter = Math.max(width, height) * 0.72;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.glow,
          {
            backgroundColor: theme.colors.violet,
            height: diameter,
            left: -diameter * 0.52,
            opacity: theme.name === 'dark' ? 0.08 : 0.05,
            top: -diameter * 0.28,
            width: diameter,
          },
        ]}
      />
      <View
        style={[
          styles.glow,
          {
            backgroundColor: theme.colors.blue,
            bottom: -diameter * 0.5,
            height: diameter * 0.82,
            opacity: theme.name === 'dark' ? 0.055 : 0.035,
            right: -diameter * 0.54,
            width: diameter * 0.82,
          },
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
    borderRadius: 999,
    position: 'absolute',
  },
});
