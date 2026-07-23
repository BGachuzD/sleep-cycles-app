import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { GradientBackground } from '../components/GradientBackground';
import {
  Badge,
  BottomSheet,
  LoadingState,
  PillButton,
  RoundedCard,
  useToast,
} from '../components/ui';
import { WheelTimePicker } from '../components/WheelTimePicker';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import {
  scheduleSmartWakeAlarm,
  scheduleUniqueNotificationAtDate,
} from '../notifications/scheduler';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  formatDuration,
  formatTime,
  formatTimeRange,
  getSleepTimesForWakeDateForProfile,
  getWakeTimesFromNowForProfile,
} from '../utils/sleep';
import {
  type Mode,
  ModeToggle,
  OptionCard,
  scoreToStars,
  Stars,
} from './smartWake/components';

type SmartOption = {
  kind: 'wake' | 'sleep';
  time: Date;
  cycles: number;
  totalMinutes: number;
  score: number;
  recommended: boolean;
  windowStart: Date;
  windowEnd: Date;
};

function recommendationReason(cycles: number, recommended: boolean): string {
  const prefix = recommended
    ? 'Esta es la mejor combinación disponible según tu perfil, duración y hora.'
    : 'Esta alternativa también termina cerca del final de un ciclo completo.';
  if (cycles <= 3) {
    return `${prefix} Es una duración corta y puede dejar deuda de sueño; úsala sólo cuando no tengas una ventana mayor.`;
  }
  if (cycles === 4) {
    return `${prefix} Cuatro ciclos ofrecen un descanso aceptable, aunque podrías conservar algo de fatiga.`;
  }
  if (cycles === 5) {
    return `${prefix} Cinco ciclos equilibran recuperación física, memoria y una hora de despertar práctica.`;
  }
  return `${prefix} Seis o más ciclos favorecen una recuperación amplia, especialmente tras noches cortas.`;
}

function buildFuture(hour: number, minute: number, now: Date): Date {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

function minutesUntil(target: Date, now: Date): number {
  return Math.round((target.getTime() - now.getTime()) / 60_000);
}

export const SmartWakeScreen: FC = () => {
  const { profile, loading } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const bottomContentPadding = useTabBarContentPadding();
  const { showToast } = useToast();

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const [mode, setMode] = useState<Mode>('now');
  const [selectedOption, setSelectedOption] = useState<SmartOption | null>(
    null,
  );

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
    () =>
      profile
        ? getWakeTimesFromNowForProfile(profile, now, [2, 3, 4, 5, 6])
        : [],
    [profile, now],
  );
  const wakeOptions = useMemo(
    () =>
      profile
        ? getSleepTimesForWakeDateForProfile(profile, wakeDate, [3, 4, 5, 6, 7])
        : [],
    [profile, wakeDate],
  );

  const scheduleWake = useCallback(
    async (windowStart: Date, windowEnd: Date, wake: Date) => {
      const { centerId } = await scheduleSmartWakeAlarm({
        keyBase: 'smartwake',
        windowStart,
        windowEnd,
      });
      if (!centerId) {
        Alert.alert(
          'No se pudo programar',
          'Revisa los permisos de notificación o la hora seleccionada.',
        );
        return false;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      showToast({
        title: 'Alarma programada',
        message: `Te despertaremos alrededor de las ${formatTime(wake)}.`,
      });
      return true;
    },
    [showToast],
  );

  const scheduleSleep = useCallback(
    async (windowStart: Date, windowEnd: Date, sleep: Date) => {
      const center = new Date(
        (windowStart.getTime() + windowEnd.getTime()) / 2,
      );
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
        Alert.alert(
          'No se pudo programar',
          'Revisa los permisos de notificación.',
        );
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      showToast({
        title: 'Recordatorio programado',
        message: `Te avisaremos para acostarte a las ${formatTime(sleep)}.`,
      });
      return true;
    },
    [wakeDate, showToast],
  );

  if (loading || !profile) {
    return (
      <View style={s.container}>
        <GradientBackground />
        <LoadingState label="Calculando tus mejores horarios…" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.content,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(260)} style={s.hero}>
          <Text style={s.heroEyebrow}>
            SON LAS {formatTime(now).toUpperCase()}
          </Text>
          <ModeToggle mode={mode} onChange={setMode} theme={theme} />
        </Animated.View>

        {mode === 'now' ? (
          <>
            <Text style={s.lead}>
              Si te acuestas ahora, elige a qué hora despertar. Cada opción cae
              al final de un ciclo completo, para no despertar aturdido.
            </Text>
            <View style={s.list}>
              {nowOptions.map((opt, i) => (
                <Animated.View
                  key={opt.cycles}
                  entering={FadeInUp.delay(Math.min(i * 36, 120)).duration(240)}
                >
                  <OptionCard
                    time={opt.wakeDate}
                    cycles={opt.cycles}
                    totalMinutes={opt.totalMinutes}
                    score={opt.score}
                    recommended={opt.isRecommended}
                    sub={`Despiertas en ${formatDuration(minutesUntil(opt.wakeDate, now))}`}
                    onPress={() =>
                      setSelectedOption({
                        kind: 'wake',
                        time: opt.wakeDate,
                        cycles: opt.cycles,
                        totalMinutes: opt.totalMinutes,
                        score: opt.score,
                        recommended: opt.isRecommended,
                        windowStart: opt.windowStart,
                        windowEnd: opt.windowEnd,
                      })
                    }
                    theme={theme}
                  />
                </Animated.View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Animated.View
              entering={FadeInDown.duration(240)}
              style={s.pickerWrap}
            >
              <Text style={s.lead}>¿A qué hora quieres despertar?</Text>
              <WheelTimePicker value={wakeDate} onChange={onPickWake} />
            </Animated.View>
            <Text style={s.lead}>
              Para despertar a las {formatTime(wakeDate)}, acuéstate a una de
              estas horas:
            </Text>
            <View style={s.list}>
              {wakeOptions.map((opt, i) => {
                const past = opt.sleepDate.getTime() < now.getTime();
                return (
                  <Animated.View
                    key={opt.cycles}
                    entering={FadeInUp.delay(Math.min(i * 36, 120)).duration(
                      240,
                    )}
                  >
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
                      onPress={
                        past
                          ? undefined
                          : () =>
                              setSelectedOption({
                                kind: 'sleep',
                                time: opt.sleepDate,
                                cycles: opt.cycles,
                                totalMinutes: opt.totalMinutes,
                                score: opt.score,
                                recommended: opt.isRecommended,
                                windowStart: opt.windowStart,
                                windowEnd: opt.windowEnd,
                              })
                      }
                      theme={theme}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <BottomSheet
        visible={Boolean(selectedOption)}
        onClose={() => setSelectedOption(null)}
        title={
          selectedOption?.kind === 'wake'
            ? 'Detalle de la alarma'
            : 'Detalle del recordatorio'
        }
        snapPoints={['72%']}
      >
        {selectedOption ? (
          <View style={{ gap: theme.spacing.lg }}>
            <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
              {selectedOption.recommended ? (
                <Badge label="Mejor opción" tone="accent" />
              ) : null}
              <Text
                style={{
                  color: theme.colors.heroText,
                  fontSize: theme.type.title1,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatTime(selectedOption.time)}
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.type.body,
                }}
              >
                {selectedOption.kind === 'wake'
                  ? 'Hora para despertar'
                  : 'Hora para acostarte'}
              </Text>
            </View>

            <View style={s.detailMetrics}>
              <View style={s.detailMetric}>
                <Text style={s.detailMetricValue}>{selectedOption.cycles}</Text>
                <Text style={s.detailMetricLabel}>ciclos</Text>
              </View>
              <View
                style={[
                  s.detailDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View style={s.detailMetric}>
                <Text style={s.detailMetricValue}>
                  {formatDuration(selectedOption.totalMinutes)}
                </Text>
                <Text style={s.detailMetricLabel}>descanso</Text>
              </View>
              <View
                style={[
                  s.detailDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View style={s.detailMetric}>
                <Stars n={scoreToStars(selectedOption.score)} theme={theme} />
                <Text style={s.detailMetricLabel}>ajuste</Text>
              </View>
            </View>

            <RoundedCard elevated={false} style={{ gap: theme.spacing.sm }}>
              <Text style={s.detailTitle}>¿Por qué esta hora?</Text>
              <Text style={s.detailBody}>
                {recommendationReason(
                  selectedOption.cycles,
                  selectedOption.recommended,
                )}
              </Text>
              <View style={s.windowRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.colors.accent[400]}
                />
                <Text style={s.detailBody}>
                  Ventana flexible:{' '}
                  {formatTimeRange(
                    selectedOption.windowStart,
                    selectedOption.windowEnd,
                  )}
                </Text>
              </View>
            </RoundedCard>

            <PillButton
              label={
                selectedOption.kind === 'wake'
                  ? 'Programar alarma'
                  : 'Programar recordatorio'
              }
              icon={
                selectedOption.kind === 'wake'
                  ? 'alarm-outline'
                  : 'moon-outline'
              }
              onPress={async () => {
                const didSchedule =
                  selectedOption.kind === 'wake'
                    ? await scheduleWake(
                        selectedOption.windowStart,
                        selectedOption.windowEnd,
                        selectedOption.time,
                      )
                    : await scheduleSleep(
                        selectedOption.windowStart,
                        selectedOption.windowEnd,
                        selectedOption.time,
                      );
                if (didSchedule) setSelectedOption(null);
              }}
            />
          </View>
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  );
};

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
    detailMetrics: { alignItems: 'center', flexDirection: 'row' },
    detailMetric: { alignItems: 'center', flex: 1, gap: 4 },
    detailMetricValue: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.subhead,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    detailMetricLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
    },
    detailDivider: { height: 32, width: 1 },
    detailTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.subhead,
      fontWeight: '600',
    },
    detailBody: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 19,
    },
    windowRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
  });
