import React, { FC, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Dimensions,
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
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

import {
  getWakeTimesFromNowForProfile,
  formatTime,
  formatDuration,
  type WakeTimeOption,
  formatTimeRange,
} from '../utils/sleep';

import { GradientBackground } from '../components/GradientBackground';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { scheduleLocalNotificationAtDate } from '../notifications/scheduler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';

type Props = NativeStackScreenProps<RootStackParamList, 'SleepNow'>;

const { height } = Dimensions.get('window');

export const SleepNowScreen: FC<Props> = ({ navigation }) => {
  const { profile, loading } = useSleepProfileContext();
  const [options, setOptions] = useState<WakeTimeOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<WakeTimeOption | null>(
    null,
  );

  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const breath = useSharedValue(1);
  const breathingIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.08, {
        duration: 3000,
      }),
      -1,
      true,
    );
  }, [breath]);

  const sheetProgress = useSharedValue(0);

  const sheetStyle = useAnimatedStyle(() => {
    const translateY = interpolate(sheetProgress.value, [0, 1], [height, 0]);
    return {
      transform: [{ translateY }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(sheetProgress.value, [0, 1], [0, 0.55]);
    return { opacity };
  });

  const openSheet = (option: WakeTimeOption) => {
    setSelectedOption(option);
    sheetProgress.value = withTiming(1, { duration: 260 });
  };

  const closeSheet = () => {
    sheetProgress.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(setSelectedOption)(null);
      }
    });
  };

  const handleCalculate = () => {
    if (!profile) return;
    const now = new Date();
    const wakeOptions = getWakeTimesFromNowForProfile(
      profile,
      now,
      [3, 4, 5, 6],
    );
    setOptions(wakeOptions);
  };

  const handleScheduleWakeNotification = async () => {
    if (!selectedOption) return;

    const centerTime = new Date(
      (selectedOption.windowStart.getTime() +
        selectedOption.windowEnd.getTime()) /
        2,
    );

    await scheduleLocalNotificationAtDate({
      title: 'Hora ideal para despertar',
      body: `Ventana ideal: ${formatTimeRange(
        selectedOption.windowStart,
        selectedOption.windowEnd,
      )}`,
      date: centerTime,
    });

    closeSheet();
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
      <View style={styles.container}>
        <GradientBackground />

        <View style={styles.content}>
          <View style={styles.header}>
            <Animated.View style={[styles.breathingIcon, breathingIconStyle]}>
              <Text style={styles.breathingIconEmoji}>🌙</Text>
            </Animated.View>
          </View>

          <Text style={styles.title}>Dormir ahora</Text>
          <Text style={styles.subtitle}>
            Si te duermes en este momento, estas son las horas recomendadas para
            despertar al final de un ciclo de sueño.
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
                Calcular horarios ideales
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('WakeAt')}
          >
            <Text style={styles.secondaryButtonText}>
              Quiero despertar a una hora específica
            </Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {options.length === 0 ? (
              <Text style={styles.helperText}>
                Toca “Calcular horarios ideales” para ver las horas sugeridas
                para despertar.
              </Text>
            ) : (
              options.map((opt, index) => (
                <Animated.View
                  key={opt.cycles}
                  entering={FadeInUp.delay(index * 90)
                    .springify()
                    .damping(14)}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.card,
                      opt.isRecommended && styles.cardRecommended,
                    ]}
                    onPress={() => openSheet(opt)}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardLabel}>
                        {opt.cycles} {opt.cycles === 1 ? 'ciclo' : 'ciclos'}
                      </Text>

                      {opt.isRecommended && (
                        <View style={styles.recommendedChip}>
                          <Text style={styles.recommendedChipText}>
                            Recomendado
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardTime}>
                      {formatTime(opt.wakeDate)}
                    </Text>

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
                      Ventana ideal para despertar:{' '}
                      {formatTimeRange(opt.windowStart, opt.windowEnd)}
                    </Text>
                    <Text style={styles.cardNote}>
                      Toca para ver más detalles de este horario.
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </View>

        {selectedOption && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View style={[styles.backdrop, backdropStyle]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
            </Animated.View>

            <Animated.View style={[styles.sheet, sheetStyle]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetLabel}>
                {selectedOption.cycles}{' '}
                {selectedOption.cycles === 1
                  ? 'ciclo de sueño'
                  : 'ciclos de sueño'}
              </Text>
              <Text style={styles.sheetTime}>
                {formatTime(selectedOption.wakeDate)}
              </Text>
              <Text style={styles.sheetDuration}>
                Dormirías aprox. {formatDuration(selectedOption.totalMinutes)} +
                {' 15 min '}para conciliar el sueño.
              </Text>

              <Text style={styles.sheetDuration}>
                Ventana ideal para despertar:{' '}
                {formatTimeRange(
                  selectedOption.windowStart,
                  selectedOption.windowEnd,
                )}
              </Text>

              <Text style={styles.sheetText}>
                Esta hora está pensada para que despiertes al final de un ciclo
                de sueño ligero. Despertar en esta fase suele sentirse más
                natural y menos pesado que salir abruptamente de un sueño
                profundo.
              </Text>

              <TouchableOpacity
                style={styles.sheetButtonPrimary}
                activeOpacity={0.9}
                onPress={handleScheduleWakeNotification}
              >
                <Text style={styles.sheetButtonPrimaryText}>
                  Programar recordatorio para despertar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetButton}
                activeOpacity={0.9}
                onPress={closeSheet}
              >
                <Text style={styles.sheetButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        <FloatingDrawerButton />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  content: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  topBarLink: {
    color: '#9ca3af',
    fontSize: 13,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  breathingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(79,70,229,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.5)',
  },
  breathingIconEmoji: {
    fontSize: 36,
  },
  title: {
    color: '#f9fafb',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryButtonInner: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontSize: 15,
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
    marginTop: 8,
  },
  cardLabel: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTime: {
    color: '#e5e7eb',
    fontSize: 28,
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#020617',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.7)',
    marginBottom: 16,
  },
  sheetLabel: {
    color: '#a5b4fc',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 4,
  },
  sheetTime: {
    color: '#e5e7eb',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  sheetDuration: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
  },
  sheetText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(15,23,42,0.94)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.35)',
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
  sheetButtonPrimary: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  sheetButtonPrimaryText: {
    color: '#022c22',
    fontSize: 15,
    fontWeight: '700',
  },
  sheetButton: {
    marginTop: 4,
    alignSelf: 'stretch',
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  sheetButtonText: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '600',
  },
});
