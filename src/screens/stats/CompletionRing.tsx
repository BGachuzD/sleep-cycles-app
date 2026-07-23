import { FC, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// CompletionRing: anillo SVG con stroke parcial
// ─────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CompletionRing: FC<{
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  theme: AppTheme;
}> = ({ completed, total, size = 116, strokeWidth = 10, theme }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(total, 1);
  const progress = Math.min(completed / safeTotal, 1);

  // El anillo se llena animado desde 0 hasta el progreso real.
  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    animatedProgress.value = withDelay(
      250,
      withTiming(progress, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.accent[400]} />
            <Stop offset="1" stopColor={theme.colors.accent[700]} />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={ringStyles.center} pointerEvents="none">
        <Text style={[ringStyles.value, { color: theme.colors.heroText }]}>
          {total > 0 ? Math.round((completed / total) * 100) : 0}
          <Text style={[ringStyles.over, { color: theme.colors.textMuted }]}>
            %
          </Text>
        </Text>
        <Text style={[ringStyles.label, { color: theme.colors.textMuted }]}>
          EN OBJETIVO
        </Text>
      </View>
    </View>
  );
};

const ringStyles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  over: { fontSize: 14, fontWeight: '700' },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
});
