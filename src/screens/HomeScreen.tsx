// src/screens/HomeScreen.tsx
import React, { FC, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { InsightCard } from '../components/InsightCard';
import { GoalCard } from '../components/GoalCard';
import { usePressScale } from '../hooks/usePressScale';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { useSleepLogContext } from '../context/SleepLogContext';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import {
  getWakeTimesFromNowForProfile,
  formatTime,
  formatDuration,
} from '../utils/sleep';
import {
  computeStats,
  computeSleepMinutes,
  computeCompleteCycles,
  todayDateString,
} from '../domain/sleepLog';
import {
  getAdjustedCycleLengthMinutes,
  getOptimalSleepWindow,
} from '../domain/sleepProfile';
import { computeInsights } from '../domain/sleepInsights';
import type { AppDrawerParamList } from '../navigation/AppDrawerNavigator';
import { navigateToScreen } from '../navigation/navigateTo';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';

type TimeContext = 'evening' | 'night' | 'morning' | 'afternoon';

function getTimeContext(hour: number): TimeContext {
  if (hour >= 18 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 4) return 'night';
  if (hour >= 4 && hour < 12) return 'morning';
  return 'afternoon';
}

type ContextConfig = {
  greeting: string;
  message: string;
  actionLabel: string;
  actionScreen: keyof AppDrawerParamList;
  actionIcon: keyof typeof Ionicons.glyphMap;
};

const TIME_CONFIG: Record<TimeContext, ContextConfig> = {
  evening: {
    greeting: 'Buenas noches',
    message: 'Es un buen momento para planear tu descanso.',
    actionLabel: '¿A qué hora despertar?',
    actionScreen: 'WakeAt',
    actionIcon: 'alarm-outline',
  },
  night: {
    greeting: 'Hora de dormir',
    message: 'Calcula cuándo despertar si te duermes ahora.',
    actionLabel: 'Dormir ahora',
    actionScreen: 'SleepNow',
    actionIcon: 'moon-outline',
  },
  morning: {
    greeting: 'Buenos días',
    message: 'Registra cómo dormiste esta noche.',
    actionLabel: 'Registrar mi sueño',
    actionScreen: 'SleepLog',
    actionIcon: 'journal-outline',
  },
  afternoon: {
    greeting: 'Buenas tardes',
    message: 'Planea tu rutina para esta noche.',
    actionLabel: 'Ver mi rutina',
    actionScreen: 'SleepRoutine',
    actionIcon: 'list-outline',
  },
};

const QUICK_NAV: Array<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof AppDrawerParamList;
}> = [
  { label: 'Dormir', icon: 'moon-outline', screen: 'SleepNow' },
  { label: 'Despertar', icon: 'alarm-outline', screen: 'WakeAt' },
  { label: 'Siesta', icon: 'bed-outline', screen: 'Nap' },
  { label: 'Rutina', icon: 'list-outline', screen: 'SleepRoutine' },
];

// ─────────────────────────────────────────────
// QuickNavItem: card pequeño tap-able con spring
// ─────────────────────────────────────────────
const QuickNavItem: FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, icon, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.93);
  return (
    <Animated.View style={[{ width: '47%' }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          quickStyles.item,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={theme.colors.accent[400]} />
        <Text
          style={[
            quickStyles.label,
            { color: theme.colors.textPrimary, fontSize: theme.type.small },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const quickStyles = StyleSheet.create({
  item: { alignItems: 'flex-start', gap: 10, borderWidth: 1 },
  label: { fontWeight: '700' },
});

// ─────────────────────────────────────────────
// HomeScreen
// ─────────────────────────────────────────────
export const HomeScreen: FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AppDrawerParamList>>();
  const { profile } = useSleepProfileContext();
  const { entries } = useSleepLogContext();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomContentPadding = useTabBarContentPadding();

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const timeCtx = getTimeContext(hour);
  const config = TIME_CONFIG[timeCtx];
  const displayName = user?.user_metadata?.display_name as string | undefined;
  const cycleMins = getAdjustedCycleLengthMinutes(profile?.age ?? 30);

  const bestOption = useMemo(() => {
    if (!profile || (timeCtx !== 'night' && timeCtx !== 'evening')) return null;
    const opts = getWakeTimesFromNowForProfile(profile, now, [4, 5, 6]);
    return opts.find((o) => o.isRecommended) ?? opts[opts.length - 1];
  }, [profile, now, timeCtx]);

  const lastEntry = entries[0] ?? null;
  const isLoggedToday = lastEntry?.date === todayDateString();

  const weeklyStats = useMemo(
    () => computeStats(entries, cycleMins),
    [entries, cycleMins],
  );

  const insights = useMemo(
    () => (profile ? computeInsights(entries, profile) : []),
    [entries, profile],
  );

  const optWindow = profile?.chronotype
    ? getOptimalSleepWindow(profile.chronotype)
    : null;

  // ── Anchor card por contexto ─────────────────────
  const renderAnchorCard = () => {
    if ((timeCtx === 'evening' || timeCtx === 'night') && bestOption) {
      return (
        <AnchorCard
          theme={theme}
          eyebrow="Si te duermes ahora"
          headline={formatTime(bestOption.wakeDate)}
          subline={`${bestOption.cycles} ciclos · ${formatDuration(bestOption.totalMinutes)}`}
          cta="Ver opciones"
          onPress={() => navigateToScreen(navigation, 'SleepNow')}
        />
      );
    }

    if (timeCtx === 'morning') {
      if (isLoggedToday && lastEntry) {
        const mins = computeSleepMinutes(lastEntry);
        return (
          <AnchorCard
            theme={theme}
            eyebrow="Esta noche dormiste"
            headline={formatDuration(mins)}
            subline={`${computeCompleteCycles(mins, cycleMins)} ciclos completos`}
            cta="Ver historial"
            onPress={() => navigateToScreen(navigation, 'Stats')}
          />
        );
      }
      return (
        <AnchorCard
          theme={theme}
          eyebrow="Hoy"
          headline="Registra tu sueño"
          subline="Tocar para registrar cómo dormiste anoche"
          cta="Registrar"
          onPress={() => navigateToScreen(navigation, 'SleepLog')}
        />
      );
    }

    if (timeCtx === 'afternoon' && optWindow) {
      return (
        <AnchorCard
          theme={theme}
          eyebrow={`Tu ventana óptima · ${optWindow.label}`}
          headline={`${optWindow.bedtimeStart} a ${optWindow.bedtimeEnd}`}
          subline={`Despertar entre ${optWindow.wakeStart} y ${optWindow.wakeEnd}`}
          cta="Ver rutina"
          onPress={() => navigateToScreen(navigation, 'SleepRoutine')}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: greeting + hora gigante + frase contextual */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.hero}>
          <Text style={styles.heroGreeting}>
            {config.greeting}
            {displayName ? `, ${displayName}` : ''}
          </Text>
          <Text style={styles.heroClock}>{formatTime(now)}</Text>
          <Text style={styles.heroMessage}>{config.message}</Text>
        </Animated.View>

        {/* CTA principal full-width gradient */}
        <Animated.View entering={FadeInDown.delay(80).duration(260)}>
          <PrimaryCTA
            label={config.actionLabel}
            icon={config.actionIcon}
            onPress={() => navigateToScreen(navigation, config.actionScreen)}
          />
        </Animated.View>

        {/* Card ancla por contexto */}
        <Animated.View entering={FadeInDown.delay(120).duration(260)}>
          {renderAnchorCard()}
        </Animated.View>

        {/* Resumen semanal compacto (siempre, si hay datos) */}
        {weeklyStats.totalDays > 0 && (
          <Animated.View entering={FadeInDown.delay(120).duration(260)}>
            <Pressable
              onPress={() => navigateToScreen(navigation, 'Stats')}
              style={styles.weeklyRow}
              accessibilityRole="button"
            >
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyValue}>
                  {formatDuration(weeklyStats.avgSleepMinutes)}
                </Text>
                <Text style={styles.weeklyLabel}>promedio</Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyValue}>{weeklyStats.avgCycles}</Text>
                <Text style={styles.weeklyLabel}>ciclos</Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyValue}>
                  {weeklyStats.currentStreak > 0
                    ? `🔥 ${weeklyStats.currentStreak}`
                    : '0'}
                </Text>
                <Text style={styles.weeklyLabel}>racha</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Tu coach: insights personalizados */}
        {insights.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(120).duration(260)}
            style={styles.coachSection}
          >
            <Text style={styles.coachEyebrow}>TU COACH</Text>
            <View style={styles.coachList}>
              {insights.slice(0, 2).map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onCtaPress={(screen) => navigateToScreen(navigation, screen)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Tu meta */}
        <Animated.View entering={FadeInDown.delay(120).duration(260)}>
          <GoalCard />
        </Animated.View>

        {/* Grid 2×2 atajos */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(260)}
          style={styles.quickGrid}
        >
          {QUICK_NAV.map((item) => (
            <QuickNavItem
              key={item.screen}
              label={item.label}
              icon={item.icon}
              onPress={() => navigateToScreen(navigation, item.screen)}
              theme={theme}
            />
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// AnchorCard reutilizable
// ─────────────────────────────────────────────
const AnchorCard: FC<{
  theme: AppTheme;
  eyebrow: string;
  headline: string;
  subline: string;
  cta: string;
  onPress: () => void;
}> = ({ theme, eyebrow, headline, subline, cta, onPress }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          anchorStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.xl,
          },
        ]}
      >
        <Text
          style={[
            anchorStyles.eyebrow,
            { color: theme.colors.textMuted, fontSize: theme.type.micro },
          ]}
        >
          {eyebrow.toUpperCase()}
        </Text>
        <Text
          style={[
            anchorStyles.headline,
            { color: theme.colors.textPrimary, fontSize: theme.type.title1 },
          ]}
        >
          {headline}
        </Text>
        <Text
          style={[
            anchorStyles.subline,
            { color: theme.colors.textSecondary, fontSize: theme.type.body },
          ]}
        >
          {subline}
        </Text>
        <View style={anchorStyles.ctaRow}>
          <Text
            style={[
              anchorStyles.ctaText,
              { color: theme.colors.accent[400], fontSize: theme.type.small },
            ]}
          >
            {cta}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.accent[400]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const anchorStyles = StyleSheet.create({
  card: { borderWidth: 1, gap: 6 },
  eyebrow: { fontWeight: '700', letterSpacing: 1 },
  headline: { fontWeight: '700', marginTop: 4 },
  subline: { marginTop: 2 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  ctaText: { fontWeight: '700' },
});

// ─────────────────────────────────────────────
// Styles principales
// ─────────────────────────────────────────────
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
    hero: { marginBottom: theme.spacing.sm },
    heroGreeting: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.bodyLarge,
      fontWeight: '600',
    },
    heroClock: {
      color: theme.colors.heroText,
      fontSize: theme.type.display,
      fontWeight: '700',
      letterSpacing: -2,
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    heroMessage: {
      color: theme.colors.textMuted,
      fontSize: theme.type.body,
      marginTop: 6,
      lineHeight: 20,
    },
    weeklyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.md,
    },
    weeklyItem: { flex: 1, alignItems: 'center' },
    weeklyValue: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.subhead,
      fontWeight: '700',
    },
    weeklyLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      marginTop: 2,
    },
    weeklyDivider: {
      width: 1,
      height: 28,
      backgroundColor: theme.colors.border,
    },
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xs,
    },
    coachSection: { gap: theme.spacing.sm },
    coachEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    coachList: { gap: theme.spacing.sm },
  });
