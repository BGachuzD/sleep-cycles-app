import React, { FC, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
} from 'react-native-reanimated';

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

export const WakeAtScreen: FC<Props> = ({ navigation }) => {
  const { profile, loading } = useSleepProfileContext();

  const initialWake = (() => {
    const now = new Date();
    now.setMinutes(0);
    return new Date(now.getTime() + 8 * 60 * 60 * 1000);
  })();

  const [wakeDate, setWakeDate] = useState<Date>(initialWake);
  const [options, setOptions] = useState<SleepTimeOption[]>([]);

  const breath = useSharedValue(1);
  const breathingIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  useEffect(() => {
    breath.value = withRepeat(withTiming(1.08, { duration: 2800 }), -1, true);
  }, [breath]);

  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleCalculate = () => {
    if (!profile) return;
    const sleepOptions = getSleepTimesForWakeDateForProfile(
      profile,
      wakeDate,
      [3, 4, 5, 6],
    );
    setOptions(sleepOptions);
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
      next.setMinutes(next.getMinutes() + delta);
      return next;
    });
  };

  const handleScheduleSleepNotification = async (opt: SleepTimeOption) => {
    const centerTime = new Date(
      (opt.windowStart.getTime() + opt.windowEnd.getTime()) / 2,
    );

    await scheduleLocalNotificationAtDate({
      title: 'Hora ideal para dormir',
      body: `Intenta acostarte entre ${formatTime(
        opt.windowStart,
      )} y ${formatTime(opt.windowEnd)} para respetar tus ciclos.`,
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
      <ScrollView style={styles.container}>
        <GradientBackground />

        <View style={styles.content}>
          <View style={styles.header}>
            <Animated.View style={[styles.breathingIcon, breathingIconStyle]}>
              <Text style={styles.breathingIconEmoji}>⏰</Text>
            </Animated.View>
          </View>

          <Text style={styles.title}>Despertar a una hora</Text>
          <Text style={styles.subtitle}>
            Elige la hora a la que quieres despertar y te sugeriré a qué hora
            deberías dormir para respetar tus ciclos de sueño.
          </Text>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerGroup}>
              <Text style={styles.pickerLabel}>Hora</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => adjustWakeHours(-1)}
                >
                  <Text style={styles.pickerButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>
                  {wakeDate.toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    hour12: false,
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => adjustWakeHours(1)}
                >
                  <Text style={styles.pickerButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pickerGroup}>
              <Text style={styles.pickerLabel}>Minutos</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => adjustWakeMinutes(-15)}
                >
                  <Text style={styles.pickerButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>
                  {wakeDate.toLocaleTimeString('es-MX', {
                    minute: '2-digit',
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => adjustWakeMinutes(15)}
                >
                  <Text style={styles.pickerButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.currentWakeText}>
            Despertarás a las{' '}
            <Text style={styles.currentWakeTime}>{formatTime(wakeDate)}</Text>
          </Text>

          <Animated.View style={[styles.primaryButton, animatedButtonStyle]}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryButtonInner}
              onPressIn={() => {
                buttonScale.value = withSpring(0.94, {
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
              <Text style={styles.primaryButtonText}>
                Calcular hora para dormir
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>
              Volver a “Dormir ahora”
            </Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {options.length === 0 ? (
              <Text style={styles.helperText}>
                Ajusta la hora y toca “Calcular hora para dormir” para ver las
                recomendaciones.
              </Text>
            ) : (
              options
                .slice()
                .reverse()
                .map((opt, index) => (
                  <Animated.View
                    key={opt.cycles}
                    entering={FadeInUp.delay(index * 90)
                      .springify()
                      .damping(14)}
                    style={[
                      styles.card,
                      opt.isRecommended && styles.cardRecommended,
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardLabel}>
                        {opt.cycles} {opt.cycles === 1 ? 'ciclo' : 'ciclos'} de
                        sueño
                      </Text>

                      {opt.isRecommended && (
                        <View style={styles.recommendedChip}>
                          <Text style={styles.recommendedChipText}>
                            Recomendado
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardDuration}>
                      Sueño objetivo: {formatDuration(opt.totalMinutes)}
                    </Text>
                    <Text style={styles.cardDuration}>
                      Tiempo total en cama:{' '}
                      {formatDuration(Math.round(opt.tibMinutes))}
                    </Text>
                    <Text style={styles.cardDuration}>
                      Eficiencia estimada: {(opt.efficiency * 100).toFixed(0)} %
                    </Text>
                    <Text style={styles.cardDuration}>
                      Ventana ideal para acostarte:{' '}
                      {formatTimeRange(opt.windowStart, opt.windowEnd)}
                    </Text>

                    <Text style={styles.cardNote}>
                      Deberías intentar acostarte dentro de esta ventana para
                      completar los ciclos propuestos. Mantén una rutina
                      constante para que tu cuerpo se adapte.
                    </Text>

                    <TouchableOpacity
                      style={styles.cardButton}
                      activeOpacity={0.9}
                      onPress={() => handleScheduleSleepNotification(opt)}
                    >
                      <Text style={styles.cardButtonText}>
                        Programar recordatorio para dormir
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))
            )}
          </ScrollView>

          <FloatingDrawerButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  breathingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59,130,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.6)',
  },
  breathingIconEmoji: {
    fontSize: 36,
  },
  title: {
    color: '#f9fafb',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 15,
    marginBottom: 24,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  pickerGroup: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(55,65,81,0.8)',
  },
  pickerLabel: {
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerButtonText: {
    color: '#e5e7eb',
    fontSize: 18,
    fontWeight: '600',
  },
  pickerValue: {
    color: '#f9fafb',
    fontSize: 20,
    fontWeight: '700',
  },
  currentWakeText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
  },
  currentWakeTime: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryButtonInner: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#022c22',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  helperText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  cardLabel: {
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTime: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDuration: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  cardNote: {
    color: '#6b7280',
    fontSize: 12,
  },
  card: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.4)',
  },
  cardRecommended: {
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendedChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  recommendedChipText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardButton: {
    marginTop: 10,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
  },
});
