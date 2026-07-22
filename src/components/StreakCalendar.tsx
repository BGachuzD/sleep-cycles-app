import React, { FC, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import {
  computeSleepMinutes,
  localDateString,
  type SleepLogEntry,
} from '../domain/sleepLog';

type Status = 'none' | 'under' | 'met';

const LegendItem: FC<{ color: string; label: string; theme: AppTheme }> = ({
  color,
  label,
  theme,
}) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>
      {label}
    </Text>
  </View>
);

/**
 * Heatmap de constancia: las últimas `weeks` semanas, un cuadro por noche,
 * coloreado según si alcanzó el objetivo (5 ciclos), quedó por debajo, o no se
 * registró. Da una lectura de un vistazo de qué tan constante es el usuario.
 */
export const StreakCalendar: FC<{
  entries: SleepLogEntry[];
  cycleMins: number;
  weeks?: number;
}> = ({ entries, cycleMins, weeks = 5 }) => {
  const { theme } = useAppTheme();
  const target = 5 * cycleMins;
  const totalDays = weeks * 7;

  const rows = useMemo(() => {
    const byDate = new Map(entries.map((e) => [e.date, e]));
    const cells: Array<{ key: string; status: Status; dayNum: number }> = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = localDateString(d);
      const entry = byDate.get(dateStr);
      const status: Status = !entry
        ? 'none'
        : computeSleepMinutes(entry) >= target
          ? 'met'
          : 'under';
      cells.push({ key: dateStr, status, dayNum: d.getDate() });
    }
    const chunked: Array<typeof cells> = [];
    for (let i = 0; i < cells.length; i += 7) chunked.push(cells.slice(i, i + 7));
    return chunked;
  }, [entries, target, totalDays]);

  const colorFor = (s: Status) =>
    s === 'met'
      ? theme.colors.accent[500]
      : s === 'under'
        ? `${theme.colors.warning}66`
        : theme.colors.surfaceElevated;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
      ]}
    >
      <View style={styles.grid}>
        {rows.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((cell) => (
              <View
                key={cell.key}
                style={[
                  styles.cell,
                  {
                    backgroundColor: colorFor(cell.status),
                    borderColor:
                      cell.status === 'none'
                        ? theme.colors.border
                        : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color:
                        cell.status === 'met'
                          ? theme.colors.white
                          : theme.colors.textMuted,
                    },
                  ]}
                >
                  {cell.dayNum}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <LegendItem color={theme.colors.accent[500]} label="En objetivo" theme={theme} />
        <LegendItem color={`${theme.colors.warning}66`} label="Bajo objetivo" theme={theme} />
        <LegendItem color={theme.colors.surfaceElevated} label="Sin registro" theme={theme} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 14, gap: 12 },
  grid: { gap: 6 },
  weekRow: { flexDirection: 'row', gap: 6 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 10, fontWeight: '700', fontVariant: ['tabular-nums'] },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, fontWeight: '600' },
});
