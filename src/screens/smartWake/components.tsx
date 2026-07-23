import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';
import { formatDuration, formatTime } from '../../utils/sleep';

export type Mode = 'now' | 'wake';

export function scoreToStars(score: number): number {
  if (score >= 20) return 5;
  if (score >= 12) return 4;
  if (score >= 5) return 3;
  if (score >= 0) return 2;
  return 1;
}

export const Stars: FC<{ n: number; theme: AppTheme }> = ({ n, theme }) => (
  <View style={styles.stars}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= n ? 'star' : 'star-outline'}
        size={11}
        color={i <= n ? theme.colors.accent[400] : theme.colors.textMuted}
      />
    ))}
  </View>
);

export const ModeToggle: FC<{
  mode: Mode;
  onChange: (m: Mode) => void;
  theme: AppTheme;
}> = ({ mode, onChange, theme }) => {
  const item = (m: Mode, label: string) => {
    const active = mode === m;
    return (
      <Pressable
        key={m}
        onPress={() => onChange(m)}
        accessibilityRole="button"
        accessibilityState={active ? { selected: true } : {}}
        style={[
          styles.toggleItem,
          {
            backgroundColor: active ? theme.colors.accent[500] : 'transparent',
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            { color: active ? theme.colors.white : theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };
  return (
    <View
      style={[
        styles.toggle,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      {item('now', 'Me duermo ahora')}
      {item('wake', 'Despertar a las…')}
    </View>
  );
};

export const OptionCard: FC<{
  time: Date;
  cycles: number;
  totalMinutes: number;
  score: number;
  recommended: boolean;
  past?: boolean;
  sub: string;
  onPress?: () => void;
  theme: AppTheme;
}> = ({
  time,
  cycles,
  totalMinutes,
  score,
  recommended,
  past,
  sub,
  onPress,
  theme,
}) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  const interactive = Boolean(onPress) && !past;
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        disabled={!interactive}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole={interactive ? 'button' : undefined}
        accessibilityState={{ disabled: !interactive }}
        accessibilityHint={
          interactive ? 'Abre los detalles antes de programar' : undefined
        }
        accessibilityLabel={`${formatTime(time)}, ${cycles} ciclos`}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor:
              recommended && interactive
                ? theme.colors.accent[500]
                : theme.colors.border,
            borderWidth: recommended && interactive ? 1.5 : 1,
            borderRadius: theme.radius.xl,
            opacity: past ? 0.5 : 1,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTime, { color: theme.colors.heroText }]}>
            {formatTime(time)}
          </Text>
          <Text style={[styles.cardCycles, { color: theme.colors.textMuted }]}>
            {cycles} {cycles === 1 ? 'CICLO' : 'CICLOS'} ·{' '}
            {formatDuration(totalMinutes)}
          </Text>
          <Text style={[styles.cardSub, { color: theme.colors.textSecondary }]}>
            {sub}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Stars n={scoreToStars(score)} theme={theme} />
          {recommended && (
            <View
              style={[
                styles.idealBadge,
                {
                  backgroundColor: `${theme.colors.accent[500]}1F`,
                  borderColor: `${theme.colors.accent[500]}55`,
                },
              ]}
            >
              <Text
                style={[styles.idealText, { color: theme.colors.accent[300] }]}
              >
                IDEAL
              </Text>
            </View>
          )}
          {interactive ? (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textMuted}
            />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: 2 },
  toggle: { flexDirection: 'row', padding: 4, gap: 4 },
  toggleItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  toggleText: { fontSize: 13, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  cardTime: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  cardCycles: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardSub: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  idealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  idealText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
