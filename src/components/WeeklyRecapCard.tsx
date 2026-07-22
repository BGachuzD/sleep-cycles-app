import React, { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../theme/ThemeProvider';
import { formatDuration } from '../utils/sleep';
import type { WeeklyRecap } from '../domain/weeklyRecap';

/**
 * Tarjeta "Tu semana": resumen de los últimos 7 días con comparación contra la
 * semana anterior. Es la superficie del resumen semanal (Sprint 3). No se
 * renderiza si no hay noches en la semana.
 */
export const WeeklyRecapCard: FC<{ recap: WeeklyRecap }> = ({ recap }) => {
  const { theme } = useAppTheme();
  if (recap.nights === 0) return null;

  const improving = recap.deltaMinutesVsPrev > 0;
  const deltaAbs = Math.abs(recap.deltaMinutesVsPrev);
  const deltaColor = improving ? theme.colors.success : theme.colors.warning;
  const showDelta = recap.hasPrevWeek && deltaAbs >= 5;

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
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
          TU SEMANA
        </Text>
        {showDelta && (
          <View
            style={[
              styles.deltaChip,
              {
                backgroundColor: `${deltaColor}1F`,
                borderColor: `${deltaColor}55`,
              },
            ]}
          >
            <Ionicons
              name={improving ? 'arrow-up' : 'arrow-down'}
              size={11}
              color={deltaColor}
            />
            <Text style={[styles.deltaText, { color: deltaColor }]}>
              {formatDuration(deltaAbs)} vs. semana pasada
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.colors.heroText }]}>
            {recap.nights}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
            noches
          </Text>
        </View>
        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.colors.heroText }]}>
            {(recap.avgMinutes / 60).toFixed(1)}h
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
            promedio
          </Text>
        </View>
        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.colors.heroText }]}>
            {recap.completedNights}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
            en objetivo
          </Text>
        </View>
      </View>

      {recap.bestNight && (
        <Text style={[styles.bestNight, { color: theme.colors.textSecondary }]}>
          Tu mejor noche: {formatDuration(recap.bestNight.minutes)} de sueño.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, gap: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  deltaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  deltaText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  statLabel: { fontSize: 11, fontWeight: '600' },
  divider: { width: 1, height: 30 },
  bestNight: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
});
