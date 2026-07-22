import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { WheelTimePicker } from '../components/WheelTimePicker';
import { usePressScale } from '../hooks/usePressScale';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import {
  scheduleSmartWakeAlarm,
  scheduleUniqueNotificationAtDate,
} from '../notifications/scheduler';
import {
  formatDuration,
  formatTime,
  getSleepTimesForWakeDateForProfile,
  getWakeTimesFromNowForProfile,
} from '../utils/sleep';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

type Mode = 'now' | 'wake';

function buildFuture(hour: number, minute: number, now: Date): Date {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

function minutesUntil(target: Date, now: Date): number {
  return Math.round((target.getTime() - now.getTime()) / 60_000);
}

function scoreToStars(score: number): number {
  if (score >= 20) return 5;
  if (score >= 12) return 4;
  if (score >= 5) return 3;
  if (score >= 0) return 2;
  return 1;
}

const Stars: FC<{ n: number; theme: AppTheme }> = ({ n, theme }) => (
  <View style={styles.stars}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= n ? 'star' : 'star-outline'}
        size={11}
        color={i <= n ? theme.colors.accent[400] : theme.colors.textMuted}
      />
    ))}
  </View>
);

const ModeToggle: FC<{
  mode: Mode;
  onChange: (m: Mode) => void;
  theme: AppTheme;
}> = ({ mode, onChange, theme }) => {
  const item = (m: Mode, label: string) => {
    const active = mode === m;
    return (
      <Pressable
        key={m}
        onPress={() => onChange(m)}
        accessibilityRole="button"
        accessibilityState={active ? { selected: true } : {}}
        style={[
          styles.toggleItem,
          {
            backgroundColor: active ? theme.colors.accent[500] : 'transparent',
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            { color: active ? theme.colors.white : theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };
  return (
    <View
      style={[
        styles.toggle,
        { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radius.lg },
      ]}
    >
      {item('now', 'Me duermo ahora')}
      {item('wake', 'Despertar a las…')}
    </View>
  );
};

const OptionCard: FC<{
  time: Date;
  cycles: number;
  totalMinutes: number;
  score: number;
  recommended: boolean;
  past?: boolean;
  sub: string;
  onPress: () => void;
  theme: AppTheme;
}> = ({ time, cycles, totalMinutes, score, recommended, past, sub, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${formatTime(time)}, ${cycles} ciclos`}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: recommended ? theme.colors.accent[500] : theme.colors.border,
            borderWidth: recommended ? 1.5 : 1,
            borderRadius: theme.radius.xl,
            opacity: past ? 0.5 : 1,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTime, { color: theme.colors.heroText }]}>
            {formatTime(time)}
          </Text>
          <Text style={[styles.cardCycles, { color: theme.colors.textMuted }]}>
            {cycles} {cycles === 1 ? 'CICLO' : 'CICLOS'} · {formatDuration(totalMinutes)}
          </Text>
          <Text style={[styles.cardSub, { color: theme.colors.textSecondary }]}>
            {sub}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Stars n={scoreToStars(score)} theme={theme} />
          {recommended && (
            <View
              style={[
                styles.idealBadge,
                {
                  backgroundColor: `${theme.colors.accent[500]}1F`,
                  borderColor: `${theme.colors.accent[500]}55`,
                },
              ]}
            >
              <Text style={[styles.idealText, { color: theme.colors.accent[300] }]}>
                IDEAL
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const SmartWakeScreen: FC = () => {
  const { profile, loading } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const [mode, setMode] = useState<Mode>('now');

  const initialWake = useMemo(() => {
    if (
      typeof profile?.wakeHour === 'number' &&
      typeof profile?.wakeMinute === 'number'
    ) {
      return buildFuture(profile.wakeHour, profile.wakeMinute, now);
    }
    const fb = new Date(now);
    fb.setMinutes(0, 0, 0);
    fb.setHours(fb.getHours() + 8);
    return fb;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.wakeHour, profile?.wakeMinute]);

  const [wakeDate, setWakeDate] = useState<Date>(initialWake);
  useEffect(() => setWakeDate(initialWake), [initialWake]);

  const onPickWake = useCallback(
    (picked: Date) =>
      setWakeDate(buildFuture(picked.getHours(), picked.getMinutes(), now)),
    [now],
  );

  const nowOptions = useMemo(
    () => (profile ? getWakeTimesFromNowForProfile(profile, now, [2, 3, 4, 5, 6]) : []),
    [profile, now],
  );
  const wakeOptions = useMemo(
    () =>
      profile ? getSleepTimesForWakeDateForProfile(profile, wakeDate, [3, 4, 5, 6, 7]) : [],
    [profile, wakeDate],
  );

  const scheduleWake = useCallback(
    async (windowStart: Date, windowEnd: Date, wake: Date) => {
      await scheduleSmartWakeAlarm({ keyBase: 'smartwake', windowStart, windowEnd });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        'Alarma programada',
        `Te despertaremos alrededor de las ${formatTime(wake)}.`,
      );
    },
    [],
  );

  const scheduleSleep = useCallback(
    async (windowStart: Date, windowEnd: Date, sleep: Date) => {
      const center = new Date((windowStart.getTime() + windowEnd.getTime()) / 2);
      const pre = new Date(windowStart.getTime() - 30 * 60_000);
      if (pre.getTime() > Date.now()) {
        await scheduleUniqueNotificationAtDate({
          key: 'smartwake:presleep',
          title: 'Prepárate para dormir',
          body: 'En 30 min empieza tu ventana de sueño. Baja el brillo y relájate. 🌙',
          date: pre,
        });
      }
      const id = await scheduleUniqueNotificationAtDate({
        key: 'smartwake:sleep',
        title: '¡Es hora de dormir!',
        body: `Acuéstate para despertar a las ${formatTime(wakeDate)}.`,
        date: center,
      });
      if (!id) {
        Alert.alert('No se pudo programar', 'Revisa los permisos de notificación.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        'Recordatorio programado',
        `Te avisaremos para acostarte a las ${formatTime(sleep)}.`,
      );
    },
    [wakeDate],
  );

  if (loading || !profile) {
    return (
      <View style={s.container}>
        <GradientBackground />
        <View style={s.loadingCenter}>
          <ActivityIndicator color={theme.colors.accent[500]} size="large" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={s.hero}>
          <Text style={s.heroEyebrow}>SON LAS {formatTime(now).toUpperCase()}</Text>
          <ModeToggle mode={mode} onChange={setMode} theme={theme} />
        </Animated.View>

        {mode === 'now' ? (
          <>
            <Text style={s.lead}>
              Si te acuestas ahora, elige a qué hora despertar. Cada opción cae al
              final de un ciclo completo, para no despertar aturdido.
            </Text>
            <View style={s.list}>
              {nowOptions.map((opt, i) => (
                <Animated.View key={opt.cycles} entering={FadeInUp.delay(i * 60).duration(400)}>
                  <OptionCard
                    time={opt.wakeDate}
                    cycles={opt.cycles}
                    totalMinutes={opt.totalMinutes}
                    score={opt.score}
                    recommended={opt.isRecommended}
                    sub={`Despiertas en ${formatDuration(minutesUntil(opt.wakeDate, now))}`}
                    onPress={() =>
                      scheduleWake(opt.windowStart, opt.windowEnd, opt.wakeDate)
                    }
                    theme={theme}
                  />
                </Animated.View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400)} style={s.pickerWrap}>
              <Text style={s.lead}>¿A qué hora quieres despertar?</Text>
              <WheelTimePicker value={wakeDate} onChange={onPickWake} />
            </Animated.View>
            <Text style={s.lead}>
              Para despertar a las {formatTime(wakeDate)}, acuéstate a una de estas
              horas:
            </Text>
            <View style={s.list}>
              {wakeOptions.map((opt, i) => {
                const past = opt.sleepDate.getTime() < now.getTime();
                return (
                  <Animated.View key={opt.cycles} entering={FadeInUp.delay(i * 60).duration(400)}>
                    <OptionCard
                      time={opt.sleepDate}
                      cycles={opt.cycles}
                      totalMinutes={opt.totalMinutes}
                      score={opt.score}
                      recommended={opt.isRecommended}
                      past={past}
                      sub={
                        past
                          ? 'Esta hora ya pasó'
                          : `Acuéstate en ${formatDuration(minutesUntil(opt.sleepDate, now))}`
                      }
                      onPress={() =>
                        past
                          ? undefined
                          : scheduleSleep(opt.windowStart, opt.windowEnd, opt.sleepDate)
                      }
                      theme={theme}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: 2 },
  toggle: { flexDirection: 'row', padding: 4, gap: 4 },
  toggleItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  toggleText: { fontSize: 13, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  cardTime: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  cardCycles: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardSub: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  idealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  idealText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.xxl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    hero: { gap: theme.spacing.md },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    lead: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
    },
    pickerWrap: { gap: theme.spacing.sm },
    list: { gap: theme.spacing.md },
  });
