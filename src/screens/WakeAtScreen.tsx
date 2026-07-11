import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../App';
import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { WheelTimePicker } from '../components/WheelTimePicker';
import { usePressScale } from '../hooks/usePressScale';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import {
  scheduleUniqueNotificationAtDate,
} from '../notifications/scheduler';
import { isTimeOptimalForChronotype } from '../domain/sleepProfile';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import {
  formatDuration,
  formatTime,
  formatTimeRange,
  getSleepTimesForWakeDateForProfile,
  type SleepTimeOption,
} from '../utils/sleep';

type Props = NativeStackScreenProps<RootStackParamList, 'WakeAt'>;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function minutesUntil(target: Date, now: Date): number {
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 60_000));
}

function scoreToStars(score: number): number {
  if (score >= 20) return 5;
  if (score >= 12) return 4;
  if (score >= 5) return 3;
  if (score >= 0) return 2;
  return 1;
}

function getCycleEducation(cycles: number): string {
  switch (cycles) {
    case 1:
      return 'Sueño de emergencia. 1 ciclo (~90 min) restaura algo de energía y siempre es mejor que no dormir, pero está muy lejos del descanso real. Úsalo solo cuando no haya alternativa.';
    case 2:
      return 'Descanso de rescate. 2 ciclos cubren una parte del sueño profundo; funcionan para una noche partida o una siesta muy larga. No lo hagas costumbre: la deuda de sueño se acumula.';
    case 3:
      return 'Descanso mínimo. 3 ciclos cubren funciones esenciales pero te dejan déficit acumulado. Úsalo solo en noches excepcionales.';
    case 4:
      return 'Descanso aceptable. 4 ciclos cubren la mayoría de la consolidación de memoria, aunque queda fatiga residual.';
    case 5:
      return 'Descanso óptimo para la mayoría de adultos. 5 ciclos completan las fases de consolidación de memoria y recuperación física.';
    case 6:
      return 'Descanso profundo. 6 ciclos ofrecen recuperación completa, ideal tras esfuerzo físico intenso o noches previas cortas.';
    case 7:
      return 'Sueño extendido. 7 ciclos ayudan a recuperar deuda de sueño acumulada. Más allá puede aumentar la inercia al despertar.';
    default:
      return '';
  }
}

/**
 * Devuelve un Date con la hora/minuto pedidos. Si la hora ya pasó hoy,
 * la coloca en el día siguiente — lo natural para "a qué hora quiero
 * despertar mañana".
 */
function buildWakeDate(hour: number, minute: number, now: Date = new Date()): Date {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// ─────────────────────────────────────────────
// ScoreStars
// ─────────────────────────────────────────────
const ScoreStars: FC<{ stars: number; theme: AppTheme }> = ({ stars, theme }) => (
  <View style={starStyles.row} accessibilityLabel={`${stars} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= stars ? 'star' : 'star-outline'}
        size={12}
        color={i <= stars ? theme.colors.accent[400] : theme.colors.textMuted}
      />
    ))}
  </View>
);

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});

// ─────────────────────────────────────────────
// SleepOptionCard: fila de "duérmete a las HH:MM"
// ─────────────────────────────────────────────
const SleepOptionCard: FC<{
  option: SleepTimeOption;
  now: Date;
  isOptimalChronotype: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ option, now, isOptimalChronotype, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const isRecommended = option.isRecommended;
  const stars = scoreToStars(option.score);
  const untilSleep = minutesUntil(option.sleepDate, now);
  const inPast = option.sleepDate.getTime() < now.getTime();

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Dormir a las ${formatTime(option.sleepDate)}, ${option.cycles} ciclos`}
        style={[
          optionStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isRecommended
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: isRecommended ? 1.5 : 1,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.xl,
            opacity: inPast ? 0.55 : 1,
          },
        ]}
      >
        <View style={optionStyles.left}>
          <Text
            style={[
              optionStyles.time,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.type.title2,
              },
            ]}
          >
            {formatTime(option.sleepDate)}
          </Text>
          <Text
            style={[
              optionStyles.cycles,
              { color: theme.colors.textMuted, fontSize: theme.type.caption },
            ]}
          >
            {option.cycles} {option.cycles === 1 ? 'CICLO' : 'CICLOS'} ·{' '}
            {formatDuration(option.totalMinutes)}
          </Text>
          <Text
            style={[
              optionStyles.until,
              { color: theme.colors.textSecondary, fontSize: theme.type.small },
            ]}
          >
            {inPast
              ? 'Esta hora ya pasó'
              : `Acuéstate en ${formatDuration(untilSleep)}`}
          </Text>
        </View>

        <View style={optionStyles.right}>
          <ScoreStars stars={stars} theme={theme} />
          {option.cycles <= 2 && (
            <View
              style={[
                optionStyles.badgeMuted,
                {
                  backgroundColor: `${theme.colors.warning}1F`,
                  borderColor: `${theme.colors.warning}55`,
                },
              ]}
            >
              <Text
                style={[
                  optionStyles.badgeMutedText,
                  { color: theme.colors.warning },
                ]}
              >
                CORTO
              </Text>
            </View>
          )}
          {isOptimalChronotype && (
            <View
              style={[
                optionStyles.badgeMuted,
                {
                  backgroundColor: `${theme.colors.accent[500]}1F`,
                  borderColor: `${theme.colors.accent[500]}55`,
                },
              ]}
            >
              <Text
                style={[
                  optionStyles.badgeMutedText,
                  { color: theme.colors.accent[300] },
                ]}
              >
                ÓPTIMO
              </Text>
            </View>
          )}
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textMuted}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const optionStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flex: 1, gap: 4 },
  time: { fontWeight: '900', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  cycles: { fontWeight: '700', letterSpacing: 0.5 },
  until: { fontWeight: '600', marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badgeMuted: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeMutedText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});

// ─────────────────────────────────────────────
// DetailRow del sheet
// ─────────────────────────────────────────────
const DetailRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: AppTheme;
}> = ({ icon, label, value, theme }) => (
  <View style={detailStyles.row}>
    <Ionicons name={icon} size={16} color={theme.colors.textMuted} />
    <Text
      style={[
        detailStyles.label,
        { color: theme.colors.textSecondary, fontSize: theme.type.body },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        detailStyles.value,
        { color: theme.colors.textPrimary, fontSize: theme.type.body },
      ]}
    >
      {value}
    </Text>
  </View>
);

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  label: { flex: 1, fontWeight: '500' },
  value: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});

// ─────────────────────────────────────────────
// WakeAtScreen
// ─────────────────────────────────────────────
export const WakeAtScreen: FC<Props> = () => {
  const { profile, loading } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Hora inicial: usar perfil (wakeHour/wakeMinute) si existe, fallback a +7h redondeada
  const initialWakeDate = useMemo(() => {
    if (
      typeof profile?.wakeHour === 'number' &&
      typeof profile?.wakeMinute === 'number'
    ) {
      return buildWakeDate(profile.wakeHour, profile.wakeMinute, now);
    }
    const fallback = new Date(now);
    fallback.setMinutes(0, 0, 0);
    fallback.setHours(fallback.getHours() + 8);
    return fallback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.wakeHour, profile?.wakeMinute]);

  const [wakeDate, setWakeDate] = useState<Date>(initialWakeDate);

  // Si el perfil llega después (carga async), sincronizamos una sola vez.
  useEffect(() => {
    setWakeDate(initialWakeDate);
  }, [initialWakeDate]);

  const handleWakeTimeChange = useCallback((picked: Date) => {
    // La rueda solo aporta hora/minuto; buildWakeDate decide si cae hoy o mañana.
    setWakeDate(buildWakeDate(picked.getHours(), picked.getMinutes()));
  }, []);

  // Cálculo automático: reactivo a profile, wakeDate y now
  const options = useMemo<SleepTimeOption[]>(() => {
    if (!profile) return [];
    return getSleepTimesForWakeDateForProfile(
      profile,
      wakeDate,
      [1, 2, 3, 4, 5, 6, 7],
    );
  }, [profile, wakeDate]);

  // Bottom sheet
  const [selectedOption, setSelectedOption] = useState<SleepTimeOption | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['78%'], []);

  const openSheet = useCallback((option: SleepTimeOption) => {
    setSelectedOption(option);
  }, []);

  useEffect(() => {
    if (selectedOption) {
      sheetRef.current?.present();
    }
  }, [selectedOption]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleSchedule = useCallback(async () => {
    if (!selectedOption) return;
    const centerTime = new Date(
      (selectedOption.windowStart.getTime() + selectedOption.windowEnd.getTime()) / 2,
    );
    const preSleepTime = new Date(selectedOption.windowStart.getTime() - 30 * 60_000);

    if (preSleepTime.getTime() > Date.now()) {
      await scheduleUniqueNotificationAtDate({
        key: `presleep:${selectedOption.cycles}:${centerTime.getTime()}`,
        title: 'Prepárate para dormir',
        body: 'En 30 min empieza tu ventana de sueño. Baja el brillo y relájate. 🌙',
        date: preSleepTime,
      });
    }

    const id = await scheduleUniqueNotificationAtDate({
      key: `sleep:${selectedOption.cycles}:${centerTime.getTime()}`,
      title: '¡Es hora de dormir!',
      body: `Ventana ideal para acostarte: ${formatTimeRange(
        selectedOption.windowStart,
        selectedOption.windowEnd,
      )}`,
      date: centerTime,
    });

    if (!id) {
      Alert.alert(
        'No se pudo programar',
        'Revisa permisos de notificación o la hora seleccionada.',
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    Alert.alert(
      'Recordatorios programados',
      `• Preparación: ${preSleepTime > new Date(0)
        ? formatTimeRange(preSleepTime, selectedOption.windowStart)
        : 'omitida (hora pasada)'
      }\n• Dormir: ${formatTimeRange(selectedOption.windowStart, selectedOption.windowEnd)}`,
    );
    closeSheet();
  }, [selectedOption, closeSheet]);

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.colors.accent[500]} size="large" />
          <Text
            style={{
              color: theme.colors.textPrimary,
              marginTop: 16,
              fontSize: theme.type.body,
            }}
          >
            Cargando perfil de sueño…
          </Text>
        </View>
      </View>
    );
  }

  // Cálculos derivados para el sheet
  const sheetUntilSleep = selectedOption
    ? minutesUntil(selectedOption.sleepDate, now)
    : 0;
  const sheetUntilWake = selectedOption
    ? minutesUntil(wakeDate, now)
    : 0;
  const sheetEducation = selectedOption ? getCycleEducation(selectedOption.cycles) : '';

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
        {/* Hero + picker */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
          <Text style={styles.heroEyebrow}>DESPIERTA A LAS</Text>

          <WheelTimePicker value={wakeDate} onChange={handleWakeTimeChange} />

          <Text style={styles.heroSubtitle}>
            Estas son las mejores horas para dormirte y despertar fresco a las{' '}
            {formatTime(wakeDate)}.
          </Text>
        </Animated.View>

        {/* Lista de opciones */}
        <View style={styles.optionsList}>
          {options.map((opt, index) => (
            <Animated.View
              key={opt.cycles}
              entering={FadeInUp.delay(index * 70).duration(400)}
            >
              <SleepOptionCard
                option={opt}
                now={now}
                isOptimalChronotype={isTimeOptimalForChronotype(
                  opt.sleepDate,
                  'sleep',
                  profile.chronotype,
                )}
                onPress={() => openSheet(opt)}
                theme={theme}
              />
            </Animated.View>
          ))}
        </View>

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>

      {/* Bottom sheet detalle */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted }}
        backdropComponent={renderBackdrop}
        onDismiss={() => setSelectedOption(null)}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selectedOption && (
            <>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetEyebrow}>DUÉRMETE A LAS</Text>
                <Text style={styles.sheetClock}>{formatTime(selectedOption.sleepDate)}</Text>
                <Text style={styles.sheetCycles}>
                  {selectedOption.cycles}{' '}
                  {selectedOption.cycles === 1 ? 'CICLO' : 'CICLOS'} ·{' '}
                  {formatDuration(selectedOption.totalMinutes)}
                </Text>
                <View style={styles.sheetStarsRow}>
                  <ScoreStars
                    stars={scoreToStars(selectedOption.score)}
                    theme={theme}
                  />
                </View>
              </View>

              <View style={styles.contextRow}>
                <View
                  style={[
                    styles.contextChip,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <Ionicons
                    name="bed-outline"
                    size={14}
                    color={theme.colors.accent[400]}
                  />
                  <Text style={styles.contextLabel}>Acuéstate en</Text>
                  <Text style={styles.contextValue}>
                    {sheetUntilSleep > 0
                      ? formatDuration(sheetUntilSleep)
                      : 'Ahora'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.contextChip,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <Ionicons
                    name="alarm-outline"
                    size={14}
                    color={theme.colors.accent[400]}
                  />
                  <Text style={styles.contextLabel}>Despertarás en</Text>
                  <Text style={styles.contextValue}>
                    {formatDuration(sheetUntilWake)}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetDetails}>
                <DetailRow
                  icon="timer-outline"
                  label="Duración total de sueño"
                  value={formatDuration(selectedOption.totalMinutes)}
                  theme={theme}
                />
                <DetailRow
                  icon="bed-outline"
                  label="Tiempo total en cama"
                  value={formatDuration(Math.round(selectedOption.tibMinutes))}
                  theme={theme}
                />
                <DetailRow
                  icon="sync-outline"
                  label="Eficiencia estimada"
                  value={`${(selectedOption.efficiency * 100).toFixed(0)}%`}
                  theme={theme}
                />
                <DetailRow
                  icon="moon-outline"
                  label="Ventana de sueño"
                  value={formatTimeRange(
                    selectedOption.windowStart,
                    selectedOption.windowEnd,
                  )}
                  theme={theme}
                />
              </View>

              {sheetEducation && (
                <View
                  style={[
                    styles.educationBlock,
                    {
                      borderColor: `${theme.colors.accent[500]}33`,
                      backgroundColor: `${theme.colors.accent[500]}0F`,
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={theme.colors.accent[400]}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.educationText}>{sheetEducation}</Text>
                </View>
              )}

              <View style={styles.ctaWrapper}>
                <PrimaryCTA
                  label="Programar recordatorio"
                  icon="notifications-outline"
                  onPress={handleSchedule}
                />
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.xxl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.xl,
    },
    hero: {
      gap: theme.spacing.md,
    },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: theme.spacing.xs,
    },
    optionsList: {
      gap: theme.spacing.md,
    },
    // Sheet
    sheetContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.lg,
    },
    sheetHeader: { alignItems: 'center', gap: 4 },
    sheetEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    sheetClock: {
      color: theme.colors.heroText,
      fontSize: theme.type.title1,
      fontWeight: '900',
      letterSpacing: -1,
      fontVariant: ['tabular-nums'],
    },
    sheetCycles: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    sheetStarsRow: { marginTop: 8 },
    contextRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    contextChip: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    contextLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    contextValue: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.subhead,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    sheetDetails: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    educationBlock: {
      flexDirection: 'row',
      gap: 10,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
    },
    educationText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 19,
    },
    ctaWrapper: { marginTop: 'auto' },
  });
