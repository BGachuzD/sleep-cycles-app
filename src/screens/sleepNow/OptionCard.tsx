import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';
import {
  formatDuration,
  formatTime,
  type WakeTimeOption,
} from '../../utils/sleep';
import { minutesUntil, scoreToStars } from './helpers';
import { ScoreStars } from './ScoreStars';

// ─────────────────────────────────────────────
// OptionCard
// ─────────────────────────────────────────────
export const OptionCard: FC<{
  option: WakeTimeOption;
  now: Date;
  isOptimalChronotype: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ option, now, isOptimalChronotype, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const isRecommended = option.isRecommended;
  const stars = scoreToStars(option.score);
  const untilWake = minutesUntil(option.wakeDate, now);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Despertar a las ${formatTime(option.wakeDate)}, ${option.cycles} ciclos`}
        style={[
          optionStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isRecommended
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: isRecommended ? 1.5 : 1,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.xl,
          },
        ]}
      >
        <View style={optionStyles.left}>
          <Text
            style={[
              optionStyles.time,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.type.title2,
              },
            ]}
          >
            {formatTime(option.wakeDate)}
          </Text>
          <Text
            style={[
              optionStyles.cycles,
              { color: theme.colors.textMuted, fontSize: theme.type.caption },
            ]}
          >
            {option.cycles} {option.cycles === 1 ? 'CICLO' : 'CICLOS'} ·{' '}
            {formatDuration(option.totalMinutes)}
          </Text>
          <Text
            style={[
              optionStyles.until,
              { color: theme.colors.textSecondary, fontSize: theme.type.small },
            ]}
          >
            Despierta en {formatDuration(untilWake)}
          </Text>
        </View>

        <View style={optionStyles.right}>
          <ScoreStars stars={stars} theme={theme} />
          {option.cycles <= 2 && (
            <View
              style={[
                optionStyles.badgeMuted,
                {
                  backgroundColor: `${theme.colors.warning}1F`,
                  borderColor: `${theme.colors.warning}55`,
                },
              ]}
            >
              <Text
                style={[
                  optionStyles.badgeMutedText,
                  { color: theme.colors.warning },
                ]}
              >
                CORTO
              </Text>
            </View>
          )}
          {isOptimalChronotype && (
            <View
              style={[
                optionStyles.badgeMuted,
                {
                  backgroundColor: `${theme.colors.accent[500]}1F`,
                  borderColor: `${theme.colors.accent[500]}55`,
                },
              ]}
            >
              <Text
                style={[
                  optionStyles.badgeMutedText,
                  { color: theme.colors.accent[300] },
                ]}
              >
                ÓPTIMO
              </Text>
            </View>
          )}
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textMuted}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const optionStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flex: 1, gap: 4 },
  time: {
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  cycles: { fontWeight: '700', letterSpacing: 0.5 },
  until: { fontWeight: '600', marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badgeMuted: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeMutedText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
