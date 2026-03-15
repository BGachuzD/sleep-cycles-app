// src/screens/StatsScreen.tsx
import React, { FC, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { useSleepLogContext } from '../context/SleepLogContext';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import {
  computeStats,
  computeSleepMinutes,
  computeCompleteCycles,
  type SleepLogEntry,
} from '../domain/sleepLog';
import { formatDuration, formatTime } from '../utils/sleep';

const FEELING_EMOJI: Record<1 | 2 | 3, string> = { 1: '😴', 2: '😐', 3: '😊' };

const StatCard: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  sub?: string;
}> = ({ icon, label, value, color, sub }) => (
  <View style={[statCardStyles.card, { borderTopColor: color }]}>
    <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 6 }} />
    <Text style={statCardStyles.value}>{value}</Text>
    <Text style={statCardStyles.label}>{label}</Text>
    {sub && <Text style={statCardStyles.sub}>{sub}</Text>}
  </View>
);

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    borderTopWidth: 3,
  },
  value: { color: '#f9fafb', fontSize: 22, fontWeight: '900', marginBottom: 2 },
  label: { color: '#9ca3af', fontSize: 11, textAlign: 'center' },
  sub: { color: '#6b7280', fontSize: 10, marginTop: 2, textAlign: 'center' },
});

// Mini bar chart for last 7 days
const WeekChart: FC<{ entries: SleepLogEntry[]; cycleMins: number }> = ({
  entries,
  cycleMins,
}) => {
  const days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = entries.find((e) => e.date === dateStr);
      const mins = entry ? computeSleepMinutes(entry) : 0;
      const cycles = entry ? computeCompleteCycles(mins, cycleMins) : 0;
      result.push({ dateStr, mins, cycles, entry, dayLabel: d.toLocaleDateString('es-MX', { weekday: 'short' }) });
    }
    return result;
  }, [entries, cycleMins]);

  const maxMins = Math.max(...days.map((d) => d.mins), 1);
  const targetMins = 5 * cycleMins;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsRow}>
        {days.map((day) => {
          const heightPct = day.mins / maxMins;
          const isGood = day.mins >= targetMins;
          const barColor = day.mins === 0 ? '#1f2937' : isGood ? '#34d399' : '#f97316';
          return (
            <View key={day.dateStr} style={chartStyles.barCol}>
              <View style={chartStyles.barWrapper}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: `${Math.max(heightPct * 100, day.mins > 0 ? 5 : 0)}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              {day.entry && (
                <Text style={chartStyles.cycleLabel}>{day.cycles}c</Text>
              )}
              <Text style={chartStyles.dayLabel}>{day.dayLabel.slice(0, 3)}</Text>
            </View>
          );
        })}
      </View>
      <View style={chartStyles.legend}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: '#34d399' }]} />
          <Text style={chartStyles.legendText}>≥ objetivo (5 ciclos)</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: '#f97316' }]} />
          <Text style={chartStyles.legendText}>Bajo el objetivo</Text>
        </View>
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 6,
    marginBottom: 8,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  bar: { width: '100%', borderRadius: 4, minHeight: 0 },
  cycleLabel: { color: '#6b7280', fontSize: 9, marginBottom: 2 },
  dayLabel: { color: '#9ca3af', fontSize: 10 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#6b7280', fontSize: 11 },
});

export const StatsScreen: FC = () => {
  const { entries } = useSleepLogContext();
  const { profile } = useSleepProfileContext();
  const navigation = useNavigation();

  const cycleMins = profile?.age
    ? profile.age < 18 ? 95 : profile.age > 60 ? 85 : 90
    : 90;

  const stats = useMemo(() => computeStats(entries, cycleMins), [entries, cycleMins]);

  const avgHours = (stats.avgSleepMinutes / 60).toFixed(1);
  const debtHours = (stats.debtMinutes / 60).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>Tu historial de sueño de las últimas semanas.</Text>
        </View>

        {entries.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400)}>
            <View style={styles.emptyBox}>
              <Ionicons name="stats-chart-outline" size={40} color="#374151" />
              <Text style={styles.emptyTitle}>Sin datos aún</Text>
              <Text style={styles.emptyText}>
                Registra tu sueño en el diario para ver estadísticas aquí.
              </Text>
              <TouchableOpacity
                style={styles.logBtn}
                onPress={() => navigation.navigate('SleepLog' as never)}
              >
                <Text style={styles.logBtnText}>Ir al registro</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Summary cards grid */}
            <Animated.View entering={FadeInUp.delay(60).duration(400)}>
              <View style={styles.cardsRow}>
                <StatCard
                  icon="time-outline"
                  label="Promedio por noche"
                  value={`${avgHours}h`}
                  color="#818cf8"
                  sub={`${stats.avgCycles} ciclos`}
                />
                <StatCard
                  icon="calendar-outline"
                  label="Noches registradas"
                  value={String(stats.totalDays)}
                  color="#60a5fa"
                />
              </View>
              <View style={[styles.cardsRow, { marginTop: 10 }]}>
                <StatCard
                  icon="flame-outline"
                  label="Racha actual"
                  value={`🔥 ${stats.currentStreak}`}
                  color="#f97316"
                  sub={`Mejor: ${stats.longestStreak} noches`}
                />
                <StatCard
                  icon="battery-half-outline"
                  label="Deuda semanal"
                  value={stats.debtMinutes > 0 ? `${debtHours}h` : '✅'}
                  color={stats.debtMinutes > 0 ? '#f87171' : '#34d399'}
                  sub={stats.debtMinutes > 0 ? 'vs objetivo 5 ciclos/noche' : 'Sin deuda esta semana'}
                />
              </View>
            </Animated.View>

            {/* Debt explanation */}
            {stats.debtMinutes > 0 && (
              <Animated.View entering={FadeInUp.delay(120).duration(400)}>
                <View style={styles.debtCard}>
                  <Ionicons name="alert-circle-outline" size={18} color="#f87171" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.debtTitle}>Deuda de sueño esta semana</Text>
                    <Text style={styles.debtText}>
                      Dormiste {formatDuration(stats.debtMinutes)} menos de lo recomendado (5 ciclos/noche).
                      Trata de recuperarlo con una siesta o durmiendo más temprano esta semana.
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Week chart */}
            <Animated.View entering={FadeInUp.delay(180).duration(400)}>
              <Text style={styles.sectionTitle}>Últimos 7 días</Text>
              <WeekChart entries={stats.weekEntries} cycleMins={cycleMins} />
            </Animated.View>

            {/* Recent entries list */}
            <Animated.View entering={FadeInUp.delay(240).duration(400)}>
              <Text style={styles.sectionTitle}>Entradas recientes</Text>
              {entries.slice(0, 10).map((entry, index) => {
                const mins = computeSleepMinutes(entry);
                const cycles = computeCompleteCycles(mins, cycleMins);
                const bedDate = new Date(entry.bedTimeISO);
                const wakeDate = new Date(entry.wakeTimeISO);
                const isGood = mins >= 5 * cycleMins;
                return (
                  <Animated.View
                    key={entry.id}
                    entering={FadeInUp.delay(240 + index * 50).duration(300)}
                  >
                    <View style={styles.entryRow}>
                      <View style={[styles.entryDot, { backgroundColor: isGood ? '#34d399' : '#f97316' }]} />
                      <View style={styles.entryContent}>
                        <Text style={styles.entryDate}>{entry.date}</Text>
                        <Text style={styles.entryTimes}>
                          {formatTime(bedDate)} → {formatTime(wakeDate)}
                        </Text>
                      </View>
                      <View style={styles.entryRight}>
                        <Text style={styles.entryDuration}>{formatDuration(mins)}</Text>
                        <Text style={styles.entryCycles}>{cycles} ciclos</Text>
                      </View>
                      <Text style={styles.entryFeeling}>{FEELING_EMOJI[entry.feeling]}</Text>
                    </View>
                  </Animated.View>
                );
              })}
            </Animated.View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { color: '#e0e7ff', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#9ca3af', fontSize: 14 },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 20,
  },
  emptyTitle: { color: '#6b7280', fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { color: '#4b5563', fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 30 },
  logBtn: {
    marginTop: 20,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  logBtnText: { color: '#e0e7ff', fontWeight: '700' },
  cardsRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  debtCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    marginTop: 10,
  },
  debtTitle: { color: '#f87171', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  debtText: { color: '#9ca3af', fontSize: 12, lineHeight: 18 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 10,
  },
  entryDot: { width: 10, height: 10, borderRadius: 5 },
  entryContent: { flex: 1 },
  entryDate: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
  entryTimes: { color: '#e5e7eb', fontSize: 13, fontWeight: '700' },
  entryRight: { alignItems: 'flex-end' },
  entryDuration: { color: '#a5b4fc', fontSize: 13, fontWeight: '700' },
  entryCycles: { color: '#6b7280', fontSize: 11 },
  entryFeeling: { fontSize: 20 },
});
