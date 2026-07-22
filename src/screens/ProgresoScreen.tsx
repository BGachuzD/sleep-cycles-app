import React, { FC, useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { navigateToScreen } from '../navigation/navigateTo';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { GradientBackground } from '../components/GradientBackground';
import { WeeklyRecapCard } from '../components/WeeklyRecapCard';
import { InsightCard } from '../components/InsightCard';
import { GoalCard } from '../components/GoalCard';
import { StreakCalendar } from '../components/StreakCalendar';
import { AchievementStrip } from '../components/AchievementStrip';
import { useSleepLogContext } from '../context/SleepLogContext';
import { useDreamEntriesContext } from '../context/DreamEntriesContext';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { computeStats } from '../domain/sleepLog';
import { getAdjustedCycleLengthMinutes } from '../domain/sleepProfile';
import { computeInsights, SLEEP_TIPS } from '../domain/sleepInsights';
import { computeAchievements } from '../domain/achievements';
import { computeWeeklyRecap } from '../domain/weeklyRecap';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

const TipCard: FC<{ title: string; body: string; theme: AppTheme }> = ({
  title,
  body,
  theme,
}) => (
  <View
    style={[
      tipStyles.card,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
      },
    ]}
  >
    <View
      style={[
        tipStyles.iconCircle,
        { backgroundColor: `${theme.colors.accent[500]}1F` },
      ]}
    >
      <Ionicons
        name="bulb-outline"
        size={16}
        color={theme.colors.accent[400]}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[tipStyles.title, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[tipStyles.body, { color: theme.colors.textSecondary }]}>
        {body}
      </Text>
    </View>
  </View>
);

const tipStyles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 14, borderWidth: 1 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});

export const ProgresoScreen: FC = () => {
  const { entries, refresh } = useSleepLogContext();
  const { dreams, refresh: refreshDreams } = useDreamEntriesContext();
  const { profile } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomContentPadding = useTabBarContentPadding();
  const [refreshing, setRefreshing] = useState(false);

  const cycleMins = getAdjustedCycleLengthMinutes(profile?.age ?? 30);
  const stats = useMemo(
    () => computeStats(entries, cycleMins),
    [entries, cycleMins],
  );
  const insights = useMemo(
    () => (profile ? computeInsights(entries, profile) : []),
    [entries, profile],
  );
  const achievements = useMemo(
    () => computeAchievements(entries, stats, dreams.length),
    [entries, stats, dreams.length],
  );
  const recap = useMemo(
    () => computeWeeklyRecap(entries, cycleMins),
    [entries, cycleMins],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), refreshDreams()]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, refreshDreams]);

  const tips = SLEEP_TIPS.slice(0, 3);
  const avgHours = stats.avgSleepMinutes / 60;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <GradientBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent[400]}
          />
        }
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.hero}>
          <Text style={styles.heroEyebrow}>PROMEDIO GENERAL</Text>
          <Text style={styles.heroClock}>
            {avgHours.toFixed(1)}
            <Text style={styles.heroUnit}> h</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            {stats.avgCycles} ciclos típicos ·{' '}
            {stats.currentStreak > 0
              ? `racha de ${stats.currentStreak}`
              : 'sin racha activa'}{' '}
            · {stats.totalDays} {stats.totalDays === 1 ? 'noche' : 'noches'}
          </Text>
        </Animated.View>

        {/* Resumen semanal */}
        <Animated.View entering={FadeInUp.delay(40).duration(260)}>
          <WeeklyRecapCard
            recap={recap}
            dreams={dreams}
            onDreamPress={() => navigateToScreen(navigation, 'DreamJournal')}
          />
        </Animated.View>

        {/* Constancia */}
        <Animated.View
          entering={FadeInUp.delay(80).duration(260)}
          style={styles.section}
        >
          <Text style={styles.sectionEyebrow}>TU CONSTANCIA</Text>
          <StreakCalendar
            entries={entries}
            dreams={dreams}
            cycleMins={cycleMins}
          />
        </Animated.View>

        {/* Coach: aparece después de los datos para explicar qué hacer. */}
        {insights.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(120).duration(260)}
            style={styles.section}
          >
            <Text style={styles.sectionEyebrow}>QUÉ PUEDES MEJORAR</Text>
            <View style={styles.stack}>
              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onCtaPress={(screen) => navigateToScreen(navigation, screen)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Meta */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <GoalCard />
        </Animated.View>

        {/* Tips educativos */}
        <Animated.View
          entering={FadeInUp.delay(120).duration(260)}
          style={styles.section}
        >
          <Text style={styles.sectionEyebrow}>PARA DORMIR MEJOR</Text>
          <View style={styles.stack}>
            {tips.map((tip) => (
              <TipCard
                key={tip.title}
                title={tip.title}
                body={tip.body}
                theme={theme}
              />
            ))}
          </View>
        </Animated.View>

        {/* Logros: refuerzo secundario después de los consejos accionables. */}
        <Animated.View
          entering={FadeInUp.delay(120).duration(260)}
          style={styles.section}
        >
          <AchievementStrip achievements={achievements} />
        </Animated.View>

        {/* Estadísticas detalladas */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <Pressable
            onPress={() => navigateToScreen(navigation, 'Stats')}
            accessibilityRole="button"
            accessibilityLabel="Analizar tendencias y causas"
            style={[
              styles.statsLink,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Ionicons
              name="bar-chart-outline"
              size={18}
              color={theme.colors.accent[400]}
            />
            <Text style={styles.statsLinkText}>
              Analizar tendencias y causas
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.textMuted}
            />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.md,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    hero: { gap: 2 },
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
    heroUnit: {
      color: theme.colors.heroText,
      fontSize: theme.type.title2,
      fontWeight: '700',
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      marginTop: 4,
    },
    section: { gap: theme.spacing.sm },
    sectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    stack: { gap: theme.spacing.sm },
    statsLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    statsLinkText: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: theme.type.body,
      fontWeight: '700',
    },
  });
