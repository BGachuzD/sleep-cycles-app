// src/screens/StatsScreen.tsx
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { navigateToScreen } from '../navigation/navigateTo';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import Svg, {
  Circle,
  Polyline,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { HealthKitBanner } from '../components/HealthKitBanner';
import { InsightCard } from '../components/InsightCard';
import { EmptyState } from '../components/ui';
import { useHealthKit } from '../hooks/useHealthKit';
import { useSleepLogContext } from '../context/SleepLogContext';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import {
  computeCompleteCycles,
  computeSleepMinutes,
  computeStats,
  localDateString,
  type SleepLogEntry,
} from '../domain/sleepLog';
import { getAdjustedCycleLengthMinutes } from '../domain/sleepProfile';
import { computeInsights } from '../domain/sleepInsights';
import { computeWeeklyRecap } from '../domain/weeklyRecap';
import { formatDuration, formatTime } from '../utils/sleep';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

// ─────────────────────────────────────────────
// Feelings (mismo lenguaje que SleepLog)
// ─────────────────────────────────────────────
type FeelingLevel = 1 | 2 | 3;
const UNDER_TARGET_COLOR = '#F7E950';

const FEELING_ICON: Record<
  FeelingLevel,
  {
    icon: keyof typeof Ionicons.glyphMap;
    colorKey: 'danger' | 'warning' | 'success';
  }
> = {
  1: { icon: 'cloud-outline', colorKey: 'danger' },
  2: { icon: 'partly-sunny-outline', colorKey: 'warning' },
  3: { icon: 'sunny-outline', colorKey: 'success' },
};

// ─────────────────────────────────────────────
// CompletionRing: anillo SVG con stroke parcial
// ─────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

  // El anillo se llena animado desde 0 hasta el progreso real.
  const animatedProgress = useSharedValue(0);
  React.useEffect(() => {
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
      const x =
        padding +
        (values.length === 1
          ? usableW / 2
          : (i / (values.length - 1)) * usableW);
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
        backgroundColor: highlight
          ? `${theme.colors.accent[500]}0D`
          : theme.colors.surfaceElevated,
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
    fontWeight: '700',
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
  isFromHealthKit: boolean;
  theme: AppTheme;
}> = ({ entry, cycleMins, isFromHealthKit, theme }) => {
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
        <View style={entryStyles.dateRow}>
          <Text
            style={[
              entryStyles.date,
              { color: theme.colors.textMuted, fontSize: theme.type.caption },
            ]}
          >
            {entry.date}
          </Text>
          {isFromHealthKit && (
            <View
              style={[
                entryStyles.sourceBadge,
                {
                  backgroundColor: `${theme.colors.success}1F`,
                  borderColor: `${theme.colors.success}55`,
                },
              ]}
            >
              <Ionicons name="heart" size={8} color={theme.colors.success} />
              <Text
                style={[
                  entryStyles.sourceBadgeText,
                  { color: theme.colors.success },
                ]}
              >
                Salud
              </Text>
            </View>
          )}
        </View>
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  date: { fontWeight: '700', letterSpacing: 0.3 },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  times: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  right: { alignItems: 'flex-end' },
  duration: { fontWeight: '700', fontVariant: ['tabular-nums'] },
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
  const bottomContentPadding = useTabBarContentPadding();
  const navigation = useNavigation();

  const hk = useHealthKit();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const cycleMins = getAdjustedCycleLengthMinutes(profile?.age ?? 30);
  const stats = useMemo(
    () => computeStats(entries, cycleMins),
    [entries, cycleMins],
  );

  const recap = useMemo(
    () => computeWeeklyRecap(entries, cycleMins),
    [entries, cycleMins],
  );

  // Cumplidas en la semana (≥ 5 ciclos)
  const targetMins = 5 * cycleMins;
  const completedThisWeek = stats.weekEntries.filter(
    (e) => computeSleepMinutes(e) >= targetMins,
  ).length;
  const completionRate = recap.nights
    ? Math.round((completedThisWeek / recap.nights) * 100)
    : 0;
  const belowTargetNights = stats.weekEntries.filter(
    (entry) => computeSleepMinutes(entry) < targetMins,
  ).length;
  const debtPerShortNight = belowTargetNights
    ? Math.round(stats.debtMinutes / belowTargetNights)
    : 0;

  // Ventana analítica: últimos 14 registros, del más antiguo al más reciente.
  const recentWindow = useMemo(() => {
    return [...entries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14)
      .reverse();
  }, [entries]);
  const sparkValues = useMemo(
    () => recentWindow.map((entry) => computeSleepMinutes(entry) / 60),
    [recentWindow],
  );
  const variabilityMinutes = useMemo(() => {
    if (recentWindow.length < 2) return 0;
    const minutes = recentWindow.map(computeSleepMinutes);
    const mean =
      minutes.reduce((sum, value) => sum + value, 0) / minutes.length;
    const variance =
      minutes.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      minutes.length;
    return Math.round(Math.sqrt(variance));
  }, [recentWindow]);
  const averageFeeling = useMemo(() => {
    if (recentWindow.length === 0) return 0;
    return (
      recentWindow.reduce((sum, entry) => sum + entry.feeling, 0) /
      recentWindow.length
    );
  }, [recentWindow]);
  const sparkMin = sparkValues.length ? Math.min(...sparkValues) : 0;
  const sparkMax = sparkValues.length ? Math.max(...sparkValues) : 0;

  const trendDelta = recap.deltaMinutesVsPrev;
  const trendMagnitude = Math.abs(trendDelta);
  const hasMeaningfulTrend = recap.hasPrevWeek && trendMagnitude >= 5;
  const trendColor = !hasMeaningfulTrend
    ? theme.colors.textPrimary
    : trendDelta > 0
      ? theme.colors.success
      : theme.colors.warning;
  const trendValue = recap.hasPrevWeek
    ? `${trendDelta > 0 ? '+' : trendDelta < 0 ? '−' : ''}${formatDuration(trendMagnitude)}`
    : `${recap.nights}/7`;
  const trendTitle = !recap.hasPrevWeek
    ? 'Construyendo tu comparación'
    : !hasMeaningfulTrend
      ? 'Tu duración se mantiene estable'
      : trendDelta > 0
        ? 'Estás durmiendo más que la semana anterior'
        : 'Tu duración bajó frente a la semana anterior';
  const trendDetail = !recap.hasPrevWeek
    ? 'Cuando completes dos periodos podremos mostrar cuánto avanzas y detectar cambios reales.'
    : trendDelta > 0
      ? 'La diferencia compara el promedio de los últimos 7 días contra los 7 anteriores.'
      : trendDelta < 0
        ? 'Revisa el gráfico para identificar qué noches rompieron tu patrón.'
        : 'El promedio cambió menos de 5 minutos entre ambos periodos.';

  // La importación histórica de 30 días vive en el HealthKitProvider:
  // se dispara sola al conectar (desde cualquier pantalla) y deduplica.
  const handleConnectHK = useCallback(async () => {
    const granted = await hk.requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permiso no concedido',
        'Puedes activarlo más tarde desde Ajustes → Salud → Mimebien.',
      );
    }
  }, [hk]);

  const showHkBanner =
    hk.isAvailable &&
    !hk.isAuthorized &&
    !hk.isLoading &&
    !hk.isBannerDismissed;

  // Empty state
  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <GradientBackground />
        <FloatingDrawerButton insideSafeArea />
        <FloatingHomeButton insideSafeArea fallbackRoute="ProgresoHome" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomContentPadding },
          ]}
          scrollIndicatorInsets={{ bottom: bottomContentPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.accent[400]}
            />
          }
        >
          <Animated.View
            entering={FadeInDown.duration(260)}
            style={styles.hero}
          >
            <Text style={styles.heroEyebrow}>ESTADÍSTICAS</Text>
            <Text style={styles.heroTitle}>Sin datos aún</Text>
            <Text style={styles.heroSubtitle}>
              Registra tu sueño en el diario para empezar a ver tu evolución.
            </Text>
          </Animated.View>

          {showHkBanner && (
            <HealthKitBanner
              onConnect={handleConnectHK}
              onDismiss={hk.dismissBanner}
            />
          )}

          <Animated.View entering={FadeInUp.delay(80).duration(260)}>
            {profile &&
              computeInsights([], profile)
                .slice(0, 1)
                .map((insight) => (
                  <View
                    key={insight.id}
                    style={{ marginBottom: theme.spacing.lg }}
                  >
                    <InsightCard
                      insight={insight}
                      onCtaPress={(screen) =>
                        navigateToScreen(navigation, screen)
                      }
                    />
                  </View>
                ))}
            <EmptyState
              icon="stats-chart-outline"
              title="Tus tendencias empiezan esta noche"
              description="Los gráficos aparecerán cuando tengas al menos una noche registrada."
              action={
                <PrimaryCTA
                  label="Ir al registro"
                  icon="journal-outline"
                  onPress={() => navigateToScreen(navigation, 'SleepLog')}
                />
              }
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea fallbackRoute="ProgresoHome" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent[400]}
          />
        }
      >
        {/* HealthKit banner */}
        {showHkBanner && (
          <HealthKitBanner
            onConnect={handleConnectHK}
            onDismiss={hk.dismissBanner}
          />
        )}

        {/* Sync histórico en curso */}
        {hk.isImporting && (
          <View
            style={[
              styles.syncBox,
              {
                backgroundColor: `${theme.colors.accent[500]}14`,
                borderColor: `${theme.colors.accent[500]}40`,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <ActivityIndicator size="small" color={theme.colors.accent[400]} />
            <Text
              style={[styles.syncText, { color: theme.colors.accent[300] }]}
            >
              Importando datos de Salud…
            </Text>
          </View>
        )}

        {/* Hero analítico: responde qué cambió, no repite el resumen general. */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>EVOLUCIÓN DE 7 DÍAS</Text>
              <Text style={[styles.heroClock, { color: trendColor }]}>
                {trendValue}
              </Text>
              <Text style={styles.heroTitle}>{trendTitle}</Text>
              <Text style={styles.heroSubtitle}>{trendDetail}</Text>
              <Text style={styles.heroContext}>
                Basado en {recap.nights}{' '}
                {recap.nights === 1 ? 'noche reciente' : 'noches recientes'}.
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

        {/* Diagnóstico: cumplimiento y forma de la tendencia. */}
        <Animated.View entering={FadeInUp.delay(80).duration(260)}>
          <Text style={styles.sectionEyebrow}>LECTURA DEL PATRÓN</Text>
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
                total={recap.nights}
                theme={theme}
              />
              <Text style={styles.ringCaption}>
                {completedThisWeek} de {recap.nights} noches registradas
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
              <Text style={styles.sparkEyebrow}>DURACIÓN</Text>
              <Text style={styles.sparkLabel}>
                últimos {recentWindow.length} registros
              </Text>
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
                  {sparkMin.toFixed(1)}h
                </Text>
                <Text style={styles.sparkRangeText}>
                  {sparkMax.toFixed(1)}h
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Señales que explican el resultado sin repetir rachas o promedios. */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <View style={styles.compactRow}>
            <CompactStat
              icon="checkmark-circle-outline"
              value={`${completionRate}%`}
              label="Cumplimiento"
              highlight={completionRate >= 70}
              theme={theme}
            />
            <CompactStat
              icon="swap-vertical-outline"
              value={`±${variabilityMinutes}m`}
              label="Variación"
              theme={theme}
            />
            <CompactStat
              icon="sunny-outline"
              value={`${averageFeeling.toFixed(1)}/3`}
              label="Sensación"
              theme={theme}
            />
          </View>
          <Text style={styles.analysisHint}>
            La variación mide qué tan estable fue tu duración en los últimos{' '}
            {recentWindow.length} registros; mientras menor sea, más consistente
            es tu descanso.
          </Text>
        </Animated.View>

        {/* Deuda */}
        {stats.debtMinutes > 0 && (
          <Animated.View entering={FadeInUp.delay(120).duration(260)}>
            <View
              style={[
                styles.debtCard,
                {
                  backgroundColor: `${theme.colors.warning}14`,
                  borderColor: `${theme.colors.warning}40`,
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={theme.colors.warning}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.debtTitle}>
                  Impacto de la deuda semanal
                </Text>
                <Text style={styles.debtText}>
                  Acumulas {formatDuration(stats.debtMinutes)} por debajo de tu
                  objetivo. En las {belowTargetNights}{' '}
                  {belowTargetNights === 1 ? 'noche corta' : 'noches cortas'},
                  el déficit promedio fue de {formatDuration(debtPerShortNight)}
                  .
                </Text>
                <Text style={styles.debtAction}>
                  Recupera gradualmente: adelanta 15–30 min tu hora de dormir;
                  evita intentar compensarlo en una sola noche.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Week chart */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
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
                    { backgroundColor: UNDER_TARGET_COLOR },
                  ]}
                />
                <Text style={styles.legendText}>Bajo objetivo</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Recent entries */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <Text style={styles.sectionEyebrow}>ENTRADAS RECIENTES</Text>
          <View style={styles.entriesList}>
            {entries.slice(0, 10).map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={FadeInUp.delay(
                  Math.min(80 + index * 24, 120),
                ).duration(240)}
              >
                <EntryRow
                  entry={entry}
                  cycleMins={cycleMins}
                  isFromHealthKit={hk.isImported(entry.id)}
                  theme={theme}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
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
      fontWeight: '700',
      letterSpacing: -2,
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    heroTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title2,
      fontWeight: '700',
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
    heroContext: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      fontWeight: '600',
      marginTop: 4,
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
    analysisHint: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      lineHeight: 17,
      paddingHorizontal: 2,
      paddingTop: theme.spacing.sm,
    },
    debtCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: theme.spacing.md,
    },
    debtTitle: {
      color: theme.colors.warning,
      fontSize: theme.type.body,
      fontWeight: '700',
      marginBottom: 4,
    },
    debtText: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 18,
    },
    debtAction: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.small,
      fontWeight: '600',
      lineHeight: 18,
      marginTop: 6,
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
    syncBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderWidth: 1,
    },
    syncText: {
      fontSize: theme.type.small,
      fontWeight: '700',
    },
  });
