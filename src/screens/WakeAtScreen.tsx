import React, { FC, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import {
  getSleepTimesForWakeDateForProfile,
  formatTime,
  formatDuration,
  type SleepTimeOption,
  formatTimeRange,
} from '../utils/sleep';
import { GradientBackground } from '../components/GradientBackground';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { scheduleLocalNotificationAtDate } from '../notifications/scheduler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';

type Props = NativeStackScreenProps<RootStackParamList, 'WakeAt'>;

const TimePickerColumn: FC<{
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
}> = ({ label, value, onIncrement, onDecrement }) => (
  <View style={pickerStyles.column}>
    <Text style={pickerStyles.label}>{label}</Text>
    <View style={pickerStyles.pickerRow}>
      <TouchableOpacity style={pickerStyles.pickerButton} onPress={onDecrement}>
        <Ionicons name="remove" size={24} color="#60a5fa" />
      </TouchableOpacity>
      <Text style={pickerStyles.pickerValue}>{value}</Text>
      <TouchableOpacity style={pickerStyles.pickerButton} onPress={onIncrement}>
        <Ionicons name="add" size={24} color="#60a5fa" />
      </TouchableOpacity>
    </View>
  </View>
);

const pickerStyles = StyleSheet.create({
  column: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1f2937',
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
  },
  pickerButton: {
    width: 44,
    height: 44,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.1)',
  },
  pickerValue: {
    color: '#f9fafb',
    fontSize: 32,
    fontWeight: '900',
  },
});

const CardOption: FC<{
  opt: SleepTimeOption;
  onSchedule: (opt: SleepTimeOption) => void;
}> = ({ opt, onSchedule }) => (
  <View style={[styles.card, opt.isRecommended && styles.cardRecommended]}>
    <View style={styles.cardHeaderRow}>
      <Text style={styles.cardCycles}>
        {opt.cycles} {opt.cycles === 1 ? 'CICLO' : 'CICLOS'}
      </Text>

      {opt.isRecommended && (
        <View style={styles.recommendedChip}>
          <Text style={styles.recommendedChipText}>⭐ Mejor Opción</Text>
        </View>
      )}
    </View>

    <Text style={styles.cardTime}>
      {formatTime(opt.windowStart)} - {formatTime(opt.windowEnd)}
    </Text>

    <View style={styles.cardDetailBox}>
      <Text style={styles.cardDuration}>
        <Ionicons name="timer-outline" size={14} color="#a5b4fc" /> Sueño
        objetivo:{' '}
        <Text style={styles.cardHighlight}>
          {formatDuration(opt.totalMinutes)}
        </Text>
      </Text>
      <Text style={styles.cardDuration}>
        <Ionicons name="bed-outline" size={14} color="#a5b4fc" /> Tiempo en
        cama: {formatDuration(Math.round(opt.tibMinutes))}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.cardButton}
      activeOpacity={0.8}
      onPress={() => onSchedule(opt)}
    >
      <Ionicons
        name="alarm-outline"
        size={16}
        color="#f9fafb"
        style={{ marginRight: 6 }}
      />
      <Text style={styles.cardButtonText}>Programar recordatorio</Text>
    </TouchableOpacity>
  </View>
);

export const WakeAtScreen: FC<Props> = ({ navigation }) => {
  const { profile, loading } = useSleepProfileContext();

  const initialWake = useMemo(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setHours(now.getHours() + 1);
    return new Date(now.getTime() + 7 * 60 * 60 * 1000);
  }, []);

  const [wakeDate, setWakeDate] = useState<Date>(initialWake);
  const [options, setOptions] = useState<SleepTimeOption[]>([]);

  const breath = useSharedValue(1);
  const breathingIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  useEffect(() => {
    breath.value = withRepeat(withTiming(1.1, { duration: 3000 }), -1, true);
  }, [breath]);

  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    backgroundColor: interpolateColor(
      buttonScale.value,
      [0.96, 1],
      ['#1e9e4f', '#22c55e'],
    ),
  }));

  const handleCalculate = () => {
    if (!profile) return;
    const sleepOptions = getSleepTimesForWakeDateForProfile(
      profile,
      wakeDate,
      [3, 4, 5, 6, 7],
    );
    setOptions(sleepOptions.reverse());
  };

  const adjustWakeHours = (delta: number) => {
    setWakeDate((prev) => {
      const next = new Date(prev);
      next.setHours(next.getHours() + delta);
      return next;
    });
  };

  const adjustWakeMinutes = (delta: number) => {
    setWakeDate((prev) => {
      const next = new Date(prev);
      const newMinutes = Math.round((next.getMinutes() + delta) / 15) * 15;
      next.setMinutes(newMinutes);
      return next;
    });
  };

  const handleScheduleSleepNotification = async (opt: SleepTimeOption) => {
    const centerTime = new Date(
      (opt.windowStart.getTime() + opt.windowEnd.getTime()) / 2,
    );

    await scheduleLocalNotificationAtDate({
      title: '¡Es hora de dormir!',
      body: `Ventana ideal para acostarte: ${formatTimeRange(
        opt.windowStart,
        opt.windowEnd,
      )}`,
      date: centerTime,
    });
  };

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingCenter}>
          <Text style={{ color: '#e5e7eb' }}>Cargando perfil de sueño…</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GradientBackground />

        <FloatingDrawerButton />

        <View style={styles.content}>
          <View style={styles.header}>
            <Animated.View style={[styles.breathingIcon, breathingIconStyle]}>
              <Text style={styles.breathingIconEmoji}>⏰</Text>
            </Animated.View>
          </View>

          <Text style={styles.title}>Definir Despertar</Text>
          <Text style={styles.subtitle}>
            Ajusta la hora a la que *debes* despertar. Te diremos cuándo
            acostarte.
          </Text>

          {/* --- Time Picker --- */}
          <View style={styles.pickerWrapper}>
            <TimePickerColumn
              label="Hora"
              value={wakeDate.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                hour12: false,
              })}
              onIncrement={() => adjustWakeHours(1)}
              onDecrement={() => adjustWakeHours(-1)}
            />
            <Text style={styles.pickerSeparator}>:</Text>
            <TimePickerColumn
              label="Minutos"
              value={wakeDate.toLocaleTimeString('es-MX', {
                minute: '2-digit',
              })}
              onIncrement={() => adjustWakeMinutes(15)}
              onDecrement={() => adjustWakeMinutes(-15)}
            />
          </View>

          <Text style={styles.currentWakeText}>
            Hora de Despertar Seleccionada:{' '}
            <Text style={styles.currentWakeTime}>{formatTime(wakeDate)}</Text>
          </Text>

          {/* --- Botón de Cálculo --- */}
          <Animated.View
            style={[styles.primaryButtonWrapper, animatedButtonStyle]}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.primaryButtonInner}
              onPressIn={() => {
                buttonScale.value = withSpring(0.96, {
                  damping: 15,
                  stiffness: 200,
                });
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1, {
                  damping: 15,
                  stiffness: 200,
                });
              }}
              onPress={handleCalculate}
            >
              <Ionicons
                name="calculator-outline"
                size={20}
                color="#022c22"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryButtonText}>
                Calcular Hora para Dormir
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* --- Lista de Opciones --- */}
          <View style={{ marginTop: 20 }}>
            {options.length === 0 ? (
              <View style={styles.helperBox}>
                <Ionicons name="moon-outline" size={24} color="#6b7280" />
                <Text style={styles.helperText}>
                  Ajusta la hora y toca "Calcular" para ver cuándo acostarte.
                </Text>
              </View>
            ) : (
              options.map((opt, index) => (
                <Animated.View
                  key={opt.cycles}
                  entering={FadeInUp.delay(index * 90)
                    .springify()
                    .damping(14)}
                >
                  <CardOption
                    opt={opt}
                    onSchedule={handleScheduleSleepNotification}
                  />
                </Animated.View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const PADDING_H = 20;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING_H,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  breathingIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(59,130,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.5)',
    marginBottom: 10,
  },
  breathingIconEmoji: {
    fontSize: 32,
  },
  title: {
    color: '#e0e7ff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#a5b4fc',
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#374151',
  },
  pickerSeparator: {
    color: '#f9fafb',
    fontSize: 36,
    fontWeight: '900',
    marginHorizontal: 10,
    paddingTop: 15,
  },
  currentWakeText: {
    color: '#9ca3af',
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  currentWakeTime: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonWrapper: {
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
    }),
  },
  primaryButtonInner: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#022c22',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#1f2937',
  },
  secondaryButtonText: {
    color: '#a5b4fc',
    fontSize: 15,
    fontWeight: '600',
  },
  helperBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  helperText: {
    color: '#9ca3af',
    fontSize: 15,
    marginTop: 15,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#10b981',
  },
  cardRecommended: {
    borderLeftColor: '#f97316',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCycles: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTime: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10,
  },
  cardDetailBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#374151',
    paddingTop: 10,
    marginBottom: 10,
  },
  cardDuration: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHighlight: {
    color: '#f9fafb',
    fontWeight: '700',
  },
  recommendedChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.15)',
  },
  recommendedChipText: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardButton: {
    marginTop: 15,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cardButtonText: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: PADDING_H,
  },
});
