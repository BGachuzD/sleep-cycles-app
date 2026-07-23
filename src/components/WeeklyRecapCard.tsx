import { Ionicons } from '@expo/vector-icons';
import React, { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { computeDreamWeekSummary, type DreamEntry } from '../domain/dreamEntry';
import type { WeeklyRecap } from '../domain/weeklyRecap';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatDuration } from '../utils/sleep';

/**
 * Tarjeta "Tu semana": resumen de los últimos 7 días con comparación contra la
 * semana anterior. Es la superficie del resumen semanal (Sprint 3). No se
 * También conecta la bitácora con la semana; se oculta sólo si no hay noches ni
 * sueños recientes.
 */
export const WeeklyRecapCard: FC<{
  recap: WeeklyRecap;
  dreams?: DreamEntry[];
  onDreamPress?: () => void;
}> = ({ recap, dreams = [], onDreamPress }) => {
  const { theme } = useAppTheme();
  const dreamSummary = computeDreamWeekSummary(dreams);
  if (recap.nights === 0 && dreamSummary.total === 0) return null;

  const dreamDetail =
    dreamSummary.total === 0
      ? 'Sin registros esta semana. Anota lo que recuerdes al despertar.'
      : dreamSummary.pleasant > dreamSummary.difficult
        ? `${dreamSummary.total} ${dreamSummary.total === 1 ? 'sueño registrado' : 'sueños registrados'} · predominan los agradables.`
        : dreamSummary.difficult > dreamSummary.pleasant
          ? `${dreamSummary.total} ${dreamSummary.total === 1 ? 'sueño registrado' : 'sueños registrados'} · observa si se repite algún tema.`
          : `${dreamSummary.total} ${dreamSummary.total === 1 ? 'sueño registrado' : 'sueños registrados'} esta semana.`;

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

      <Pressable
        accessibilityRole={onDreamPress ? 'button' : undefined}
        accessibilityLabel="Abrir bitácora de sueños"
        disabled={!onDreamPress}
        onPress={onDreamPress}
        style={({ pressed }) => [
          styles.dreamRow,
          {
            borderTopColor: theme.colors.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.dreamIcon,
            { backgroundColor: `${theme.colors.violet}1F` },
          ]}
        >
          <Ionicons name="cloudy-night" size={18} color={theme.colors.violet} />
        </View>
        <View style={styles.dreamCopy}>
          <Text
            style={[styles.dreamTitle, { color: theme.colors.textPrimary }]}
          >
            Estado de tus sueños
          </Text>
          <Text
            style={[styles.dreamDetail, { color: theme.colors.textSecondary }]}
          >
            {dreamDetail}
          </Text>
        </View>
        {onDreamPress ? (
          <Ionicons
            name="chevron-forward"
            size={17}
            color={theme.colors.textMuted}
          />
        ) : null}
      </Pressable>
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
  dreamRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  dreamIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  dreamCopy: { flex: 1, gap: 2 },
  dreamTitle: { fontSize: 13, fontWeight: '700' },
  dreamDetail: { fontSize: 12, lineHeight: 17 },
});
