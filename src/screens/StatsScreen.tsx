// src/screens/StatsScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { FC, useCallback, useMemo, useState } from 'react';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { GradientBackground } from '../components/GradientBackground';
import { HealthKitBanner } from '../components/HealthKitBanner';
import { InsightCard } from '../components/InsightCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { EmptyState } from '../components/ui';
import { useSleepLogContext } from '../context/SleepLogContext';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { computeInsights } from '../domain/sleepInsights';
import { computeSleepMinutes, computeStats } from '../domain/sleepLog';
import { getAdjustedCycleLengthMinutes } from '../domain/sleepProfile';
import { computeWeeklyRecap } from '../domain/weeklyRecap';
import { useHealthKit } from '../hooks/useHealthKit';
import { navigateToScreen } from '../navigation/navigateTo';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatDuration } from '../utils/sleep';
import { CompactStat } from './stats/CompactStat';
import { CompletionRing } from './stats/CompletionRing';
import { UNDER_TARGET_COLOR } from './stats/constants';
import { EntryRow } from './stats/EntryRow';
import { Sparkline } from './stats/Sparkline';
import { WeekChart } from './stats/WeekChart';

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
