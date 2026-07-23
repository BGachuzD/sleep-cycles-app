import { FC, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  computeCompleteCycles,
  computeSleepMinutes,
  localDateString,
  type SleepLogEntry,
} from '../../domain/sleepLog';
import type { AppTheme } from '../../theme/theme';
import { formatDuration } from '../../utils/sleep';
import { UNDER_TARGET_COLOR } from './constants';

// ─────────────────────────────────────────────
// WeekChart: bars verticales con cycles + day label
// ─────────────────────────────────────────────
export const WeekChart: FC<{
  entries: SleepLogEntry[];
  cycleMins: number;
  theme: AppTheme;
}> = ({ entries, cycleMins, theme }) => {
  const days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = localDateString(d);
      const entry = entries.find((e) => e.date === dateStr);
      const mins = entry ? computeSleepMinutes(entry) : 0;
      const cycles = entry ? computeCompleteCycles(mins, cycleMins) : 0;
      result.push({
        dateStr,
        mins,
        cycles,
        entry,
        dayLabel: d
          .toLocaleDateString('es-MX', { weekday: 'short' })
          .replace('.', ''),
      });
    }
    return result;
  }, [entries, cycleMins]);

  const maxMins = Math.max(...days.map((d) => d.mins), 1);
  const targetMins = 5 * cycleMins;

  return (
    <View
      accessibilityLabel="Resumen de sueño de los últimos siete días"
      accessibilityRole="summary"
      style={chartStyles.barsRow}
    >
      {days.map((day, index) => {
        const heightPct = day.mins / maxMins;
        const isGood = day.mins >= targetMins;
        const barColor =
          day.mins === 0
            ? theme.colors.border
            : isGood
              ? theme.colors.accent[500]
              : UNDER_TARGET_COLOR;
        return (
          <View
            key={day.dateStr}
            accessible
            accessibilityLabel={
              day.entry
                ? `${day.dayLabel}: ${formatDuration(day.mins)}, ${day.cycles} ciclos${isGood ? ', objetivo alcanzado' : ', debajo del objetivo'}`
                : `${day.dayLabel}: sin registro`
            }
            style={chartStyles.barCol}
          >
            <View style={chartStyles.barWrapper}>
              <Animated.View
                entering={FadeInUp.delay(Math.min(80 + index * 24, 120))
                  .springify()
                  .damping(15)}
                style={[
                  chartStyles.bar,
                  {
                    height: `${Math.max(heightPct * 100, day.mins > 0 ? 5 : 0)}%`,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                chartStyles.cycleLabel,
                { color: theme.colors.textMuted },
              ]}
            >
              {day.entry ? `${day.cycles}c` : '·'}
            </Text>
            <Text
              style={[
                chartStyles.dayLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              {day.dayLabel.slice(0, 3)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const chartStyles = StyleSheet.create({
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    gap: 8,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  bar: { width: '100%', borderRadius: 6, minHeight: 0 },
  cycleLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
