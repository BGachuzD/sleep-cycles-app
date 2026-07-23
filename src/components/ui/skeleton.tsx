import React, { useEffect } from 'react';
import { type DimensionValue, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/theme/ThemeProvider';

export function Skeleton({
  width = '100%',
  height = 18,
  radius,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}) {
  const { theme } = useAppTheme();
  const opacity = useSharedValue(0.44);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.82, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: radius ?? theme.radius.sm,
          height,
          width,
        },
        animatedStyle,
      ]}
    />
  );
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  const { theme } = useAppTheme();
  return (
    <View
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={{
        flex: 1,
        gap: theme.spacing.lg,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      <Skeleton width="42%" height={16} />
      <Skeleton height={88} radius={theme.radius.lg} />
      <Skeleton height={88} radius={theme.radius.lg} />
      <Skeleton width="72%" height={16} />
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.type.caption,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
