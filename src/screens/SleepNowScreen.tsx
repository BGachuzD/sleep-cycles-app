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
import { usePressScale } from '../hooks/usePressScale';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { scheduleSmartWakeAlarm } from '../notifications/scheduler';
import { isTimeOptimalForChronotype } from '../domain/sleepProfile';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import {
  formatDuration,
  formatTime,
  formatTimeRange,
  getWakeTimesFromNowForProfile,
  type WakeTimeOption,
} from '../utils/sleep';

type Props = NativeStackScreenProps<RootStackParamList, 'SleepNow'>;

// ─────────────────────────────────────────────
// Helpers de presentación
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
        color={
          i <= stars ? theme.colors.accent[400] : theme.colors.textMuted
        }
      />
    ))}
  </View>
);

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});

// ─────────────────────────────────────────────
// OptionCard
// ─────────────────────────────────────────────
const OptionCard: FC<{
  option: WakeTimeOption;
  now: Date;
  isOptimalChronotype: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ option, now, isOptimalChronotype, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const isRecommended = option.isRecommended;
  const stars = scoreToStars(option.score);
  const untilWake = minutesUntil(option.wakeDate, now);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Despertar a las ${formatTime(option.wakeDate)}, ${option.cycles} ciclos`}
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
            {formatTime(option.wakeDate)}
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
            Despierta en {formatDuration(untilWake)}
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
// Sheet detail row
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
// SleepNowScreen
// ─────────────────────────────────────────────
export const SleepNowScreen: FC = () => {
  const { profile, loading } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const [selectedOption, setSelectedOption] = useState<WakeTimeOption | null>(null);

  // Cálculo automático: cada vez que cambia profile o now (cada minuto)
  const options = useMemo<WakeTimeOption[]>(() => {
    if (!profile) return [];
    return getWakeTimesFromNowForProfile(profile, now, [1, 2, 3, 4, 5, 6, 7]);
  }, [profile, now]);

  // Bottom sheet
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['78%'], []);

  const openSheet = useCallback((option: WakeTimeOption) => {
    setSelectedOption(option);
  }, []);

  // El sheet se presenta cuando selectedOption ya está en el state.
  // Evita el flash de contenido vacío en la primera apertura porque
  // el render con la data nueva ocurre antes que present().
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
    const { centerId } = await scheduleSmartWakeAlarm({
      keyBase: `wake:${selectedOption.cycles}:${selectedOption.wakeDate.getTime()}`,
      windowStart: selectedOption.windowStart,
      windowEnd: selectedOption.windowEnd,
    });

    if (!centerId) {
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
      'Alarma inteligente programada',
      `3 alertas escalonadas en la ventana ${formatTimeRange(
        selectedOption.windowStart,
        selectedOption.windowEnd,
      )}`,
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

  // Cálculos derivados para el sheet (sólo si hay selectedOption)
  const sheetSleepStart = selectedOption
    ? new Date(now.getTime() + selectedOption.latencyMinutes * 60_000)
    : null;
  const sheetUntilWake = selectedOption
    ? minutesUntil(selectedOption.wakeDate, now)
    : 0;
  const sheetEducation = selectedOption
    ? getCycleEducation(selectedOption.cycles)
    : '';

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
        {/* Hero */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
          <Text style={styles.heroEyebrow}>AHORA SON LAS</Text>
          <Text style={styles.heroClock}>{formatTime(now)}</Text>
          <Text style={styles.heroSubtitle}>
            Estas son las mejores horas para despertar al final de un ciclo de
            sueño ligero.
          </Text>
        </Animated.View>

        {/* Opciones */}
        <View style={styles.optionsList}>
          {options.map((opt, index) => (
            <Animated.View
              key={opt.cycles}
              entering={FadeInUp.delay(index * 70).duration(400)}
            >
              <OptionCard
                option={opt}
                now={now}
                isOptimalChronotype={isTimeOptimalForChronotype(
                  opt.wakeDate,
                  'wake',
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

      {/* Bottom Sheet detalle */}
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
          {selectedOption && sheetSleepStart && (
            <>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetEyebrow}>DESPERTAR A LAS</Text>
                <Text style={styles.sheetClock}>
                  {formatTime(selectedOption.wakeDate)}
                </Text>
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

              {/* Bloques de contexto temporal */}
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
                    name="moon-outline"
                    size={14}
                    color={theme.colors.accent[400]}
                  />
                  <Text style={styles.contextLabel}>Duérmete a las</Text>
                  <Text style={styles.contextValue}>
                    {formatTime(sheetSleepStart)}
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
                    name="hourglass-outline"
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
                  icon="sunny-outline"
                  label="Ventana de despertar"
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
                  label="Programar alarma"
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
      gap: theme.spacing.lg,
    },
    hero: { marginBottom: theme.spacing.sm },
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
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 8,
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
