// src/screens/StatsScreen.tsx
import React, { FC, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { useSleepLogContext } from '../context/SleepLogContext';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import {
  computeCompleteCycles,
  computeSleepMinutes,
  computeStats,
  type SleepLogEntry,
} from '../domain/sleepLog';
import { getAdjustedCycleLengthMinutes } from '../domain/sleepProfile';
import { formatDuration, formatTime } from '../utils/sleep';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

// ─────────────────────────────────────────────
// Feelings (mismo lenguaje que SleepLog)
// ─────────────────────────────────────────────
type FeelingLevel = 1 | 2 | 3;

const FEELING_ICON: Record<
  FeelingLevel,
  { icon: keyof typeof Ionicons.glyphMap; colorKey: 'danger' | 'warning' | 'success' }
> = {
  1: { icon: 'cloud-outline', colorKey: 'danger' },
  2: { icon: 'partly-sunny-outline', colorKey: 'warning' },
  3: { icon: 'sunny-outline', colorKey: 'success' },
};

// ─────────────────────────────────────────────
// CompletionRing: anillo SVG con stroke parcial
// ─────────────────────────────────────────────
const CompletionRing: FC<{
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
  const dashOffset = circumference * (1 - progress);

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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={ringStyles.center} pointerEvents="none">
        <Text style={[ringStyles.value, { color: theme.colors.heroText }]}>
          {completed}
          <Text
            style={[ringStyles.over, { color: theme.colors.textMuted }]}
          >
            /{total}
          </Text>
        </Text>
        <Text style={[ringStyles.label, { color: theme.colors.textMuted }]}>
          CUMPLIDAS
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
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  over: { fontSize: 14, fontWeight: '700' },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});

// ─────────────────────────────────────────────
// Sparkline: polyline SVG con puntos
// ─────────────────────────────────────────────
const Sparkline: FC<{
  values: number[];
  width: number;
  height: number;
  color: string;
  fillColor?: string;
}> = ({ values, width, height, color, fillColor }) => {
  if (values.length === 0) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const padding = 3;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const points = values
    .map((v, i) => {
      const x = padding + (values.length === 1 ? usableW / 2 : (i / (values.length - 1)) * usableW);
      const y = padding + usableH - ((v - min) / range) * usableH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      {fillColor && (
        <Polyline
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill={fillColor}
          stroke="none"
        />
      )}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// ─────────────────────────────────────────────
// WeekChart: bars verticales con cycles + day label
// ─────────────────────────────────────────────
const WeekChart: FC<{
  entries: SleepLogEntry[];
  cycleMins: number;
  theme: AppTheme;
}> = ({ entries, cycleMins, theme }) => {
  const days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
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
    <View style={chartStyles.barsRow}>
      {days.map((day) => {
        const heightPct = day.mins / maxMins;
        const isGood = day.mins >= targetMins;
        const barColor =
          day.mins === 0
            ? theme.colors.border
            : isGood
              ? theme.colors.accent[500]
              : theme.colors.danger;
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
  barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end', marginBottom: 4 },
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

// ─────────────────────────────────────────────
// CompactStat: pill horizontal con icono+valor+label
// ─────────────────────────────────────────────
const CompactStat: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  highlight?: boolean;
  theme: AppTheme;
}> = ({ icon, value, label, highlight, theme }) => (
  <View
    style={[
      compactStyles.card,
      {
        backgroundColor: theme.colors.surface,
        borderColor: highlight ? theme.colors.accent[500] : theme.colors.border,
        borderWidth: highlight ? 1.5 : 1,
        borderRadius: theme.radius.lg,
      },
    ]}
  >
    <Ionicons
      name={icon}
      size={16}
      color={highlight ? theme.colors.accent[400] : theme.colors.textMuted}
    />
    <Text
      style={[
        compactStyles.value,
        { color: theme.colors.textPrimary, fontSize: theme.type.subhead },
      ]}
    >
      {value}
    </Text>
    <Text
      style={[
        compactStyles.label,
        { color: theme.colors.textMuted, fontSize: theme.type.caption },
      ]}
    >
      {label}
    </Text>
  </View>
);

const compactStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 4,
  },
  value: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ─────────────────────────────────────────────
// EntryRow del historial
// ─────────────────────────────────────────────
const EntryRow: FC<{
  entry: SleepLogEntry;
  cycleMins: number;
  theme: AppTheme;
}> = ({ entry, cycleMins, theme }) => {
  const mins = computeSleepMinutes(entry);
  const cycles = computeCompleteCycles(mins, cycleMins);
  const bedDate = new Date(entry.bedTimeISO);
  const wakeDate = new Date(entry.wakeTimeISO);
  const isGood = mins >= 5 * cycleMins;
  const feeling = FEELING_ICON[entry.feeling];
  const feelingColor = theme.colors[feeling.colorKey];

  return (
    <View
      style={[
        entryStyles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View
        style={[
          entryStyles.dot,
          {
            backgroundColor: isGood
              ? theme.colors.accent[500]
              : theme.colors.danger,
          },
        ]}
      />
      <View style={entryStyles.content}>
        <Text
          style={[
            entryStyles.date,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          {entry.date}
        </Text>
        <Text
          style={[
            entryStyles.times,
            { color: theme.colors.textPrimary, fontSize: theme.type.body },
          ]}
        >
          {formatTime(bedDate)} → {formatTime(wakeDate)}
        </Text>
      </View>
      <View style={entryStyles.right}>
        <Text
          style={[
            entryStyles.duration,
            { color: theme.colors.heroText, fontSize: theme.type.body },
          ]}
        >
          {formatDuration(mins)}
        </Text>
        <Text
          style={[
            entryStyles.cycles,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          {cycles} ciclos
        </Text>
      </View>
      <View
        style={[
          entryStyles.feelingPill,
          {
            backgroundColor: `${feelingColor}1F`,
            borderColor: `${feelingColor}55`,
          },
        ]}
      >
        <Ionicons name={feeling.icon} size={14} color={feelingColor} />
      </View>
    </View>
  );
};

const entryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  content: { flex: 1 },
  date: { fontWeight: '700', letterSpacing: 0.3, marginBottom: 2 },
  times: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  right: { alignItems: 'flex-end' },
  duration: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  cycles: { marginTop: 2 },
  feelingPill: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

// ─────────────────────────────────────────────
// StatsScreen
// ─────────────────────────────────────────────
export const StatsScreen: FC = () => {
  const { entries, loading, refresh } = useSleepLogContext();
  const { profile } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();

  const cycleMins = getAdjustedCycleLengthMinutes(profile?.age ?? 30);
  const stats = useMemo(
    () => computeStats(entries, cycleMins),
    [entries, cycleMins],
  );

  const avgHours = stats.avgSleepMinutes / 60;
  const debtHours = stats.debtMinutes / 60;

  // Cumplidas en la semana (≥ 5 ciclos)
  const targetMins = 5 * cycleMins;
  const completedThisWeek = stats.weekEntries.filter(
    (e) => computeSleepMinutes(e) >= targetMins,
  ).length;

  // Sparkline: últimas 14 entradas (en orden cronológico antiguo → reciente)
  const sparkValues = useMemo(() => {
    const recent = entries.slice(0, 14).reverse();
    return recent.map((e) => computeSleepMinutes(e) / 60);
  }, [entries]);

  // Empty state
  if (entries.length === 0) {
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
          <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
            <Text style={styles.heroEyebrow}>ESTADÍSTICAS</Text>
            <Text style={styles.heroTitle}>Sin datos aún</Text>
            <Text style={styles.heroSubtitle}>
              Registra tu sueño en el diario para empezar a ver tu evolución.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(80).duration(500)}>
            <View style={styles.emptyBox}>
              <Ionicons
                name="stats-chart-outline"
                size={36}
                color={theme.colors.textMuted}
              />
              <Text style={styles.emptyText}>
                Tus gráficos aparecerán aquí cuando tengas al menos una noche
                registrada.
              </Text>
            </View>
            <View style={styles.emptyCta}>
              <PrimaryCTA
                label="Ir al registro"
                icon="journal-outline"
                onPress={() => navigation.navigate('SleepLog' as never)}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
        {/* Hero KPI */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>PROMEDIO POR NOCHE</Text>
              <Text style={styles.heroClock}>
                {avgHours.toFixed(1)}
                <Text style={styles.heroUnit}> h</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                {stats.avgCycles} ciclos típicos · {stats.totalDays}{' '}
                {stats.totalDays === 1 ? 'noche registrada' : 'noches registradas'}
              </Text>
            </View>
            <Pressable
              onPress={refresh}
              disabled={loading}
              hitSlop={8}
              style={styles.refreshBtn}
              accessibilityRole="button"
              accessibilityLabel="Refrescar estadísticas"
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.accent[400]}
                />
              ) : (
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={theme.colors.accent[400]}
                />
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Ring + Sparkline */}
        <Animated.View entering={FadeInUp.delay(80).duration(500)}>
          <View style={styles.dashboardRow}>
            <View
              style={[
                styles.ringCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.xl,
                },
              ]}
            >
              <CompletionRing
                completed={completedThisWeek}
                total={7}
                theme={theme}
              />
              <Text style={styles.ringCaption}>
                noches con ≥ 5 ciclos esta semana
              </Text>
            </View>

            <View
              style={[
                styles.sparkCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.xl,
                },
              ]}
            >
              <Text style={styles.sparkEyebrow}>TENDENCIA</Text>
              <Text style={styles.sparkLabel}>últimas 14 noches</Text>
              <View style={styles.sparkChartWrapper}>
                <Sparkline
                  values={sparkValues}
                  width={150}
                  height={56}
                  color={theme.colors.accent[400]}
                  fillColor={`${theme.colors.accent[500]}22`}
                />
              </View>
              <View style={styles.sparkRange}>
                <Text style={styles.sparkRangeText}>
                  {Math.min(...sparkValues, 0).toFixed(1)}h
                </Text>
                <Text style={styles.sparkRangeText}>
                  {Math.max(...sparkValues, 0).toFixed(1)}h
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Compact stats row */}
        <Animated.View entering={FadeInUp.delay(140).duration(500)}>
          <View style={styles.compactRow}>
            <CompactStat
              icon="flame-outline"
              value={String(stats.currentStreak)}
              label="Racha"
              highlight={stats.currentStreak > 0}
              theme={theme}
            />
            <CompactStat
              icon="trophy-outline"
              value={String(stats.longestStreak)}
              label="Mejor"
              theme={theme}
            />
            <CompactStat
              icon="moon-outline"
              value={`${stats.avgCycles}`}
              label="Ciclos prom"
              theme={theme}
            />
          </View>
        </Animated.View>

        {/* Deuda */}
        {stats.debtMinutes > 0 && (
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <View
              style={[
                styles.debtCard,
                {
                  backgroundColor: `${theme.colors.danger}14`,
                  borderColor: `${theme.colors.danger}40`,
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={theme.colors.danger}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.debtTitle}>
                  Deuda de sueño esta semana
                </Text>
                <Text style={styles.debtText}>
                  Dormiste {formatDuration(stats.debtMinutes)} ({debtHours.toFixed(1)}
                  h) menos del objetivo (5 ciclos/noche). Considera una siesta o
                  acostarte más temprano.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Week chart */}
        <Animated.View entering={FadeInUp.delay(260).duration(500)}>
          <Text style={styles.sectionEyebrow}>ÚLTIMOS 7 DÍAS</Text>
          <View
            style={[
              styles.chartCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.xl,
              },
            ]}
          >
            <WeekChart
              entries={stats.weekEntries}
              cycleMins={cycleMins}
              theme={theme}
            />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: theme.colors.accent[500] },
                  ]}
                />
                <Text style={styles.legendText}>≥ objetivo (5 ciclos)</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: theme.colors.danger },
                  ]}
                />
                <Text style={styles.legendText}>Bajo objetivo</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Recent entries */}
        <Animated.View entering={FadeInUp.delay(320).duration(500)}>
          <Text style={styles.sectionEyebrow}>ENTRADAS RECIENTES</Text>
          <View style={styles.entriesList}>
            {entries.slice(0, 10).map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={FadeInUp.delay(320 + index * 40).duration(300)}
              >
                <EntryRow
                  entry={entry}
                  cycleMins={cycleMins}
                  theme={theme}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.xxl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    hero: { gap: 4 },
    heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    heroClock: {
      color: theme.colors.heroText,
      fontSize: theme.type.display,
      fontWeight: '800',
      letterSpacing: -2,
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    heroTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title2,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginTop: 4,
    },
    heroUnit: {
      color: theme.colors.heroText,
      fontSize: theme.type.title2,
      fontWeight: '700',
      letterSpacing: 0,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 6,
    },
    refreshBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: 6,
    },
    dashboardRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    ringCard: {
      width: 156,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      gap: 10,
    },
    ringCaption: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      textAlign: 'center',
      lineHeight: 14,
    },
    sparkCard: {
      flex: 1,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      borderWidth: 1,
      justifyContent: 'space-between',
    },
    sparkEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    sparkLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.caption,
      marginTop: 2,
    },
    sparkChartWrapper: {
      marginTop: 8,
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    sparkRange: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    sparkRangeText: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    compactRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    debtCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: theme.spacing.md,
      borderWidth: 1,
    },
    debtTitle: {
      color: theme.colors.danger,
      fontSize: theme.type.body,
      fontWeight: '800',
      marginBottom: 4,
    },
    debtText: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 18,
    },
    sectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 8,
      marginTop: theme.spacing.md,
    },
    chartCard: {
      padding: theme.spacing.lg,
      borderWidth: 1,
      gap: 12,
    },
    legendRow: {
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      fontWeight: '600',
    },
    entriesList: { gap: theme.spacing.sm },
    emptyBox: {
      alignItems: 'center',
      gap: 12,
      paddingVertical: theme.spacing.huge,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: theme.type.small,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.xxl,
      lineHeight: 18,
    },
    emptyCta: { marginTop: theme.spacing.lg },
  });
