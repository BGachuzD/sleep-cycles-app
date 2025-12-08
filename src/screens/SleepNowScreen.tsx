import React, { FC, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
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
  Extrapolation,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

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

const { width, height } = Dimensions.get('window');

export const SleepNowScreen: FC<Props> = ({ navigation }) => {
  const { profile, loading } = useSleepProfileContext();
  const [options, setOptions] = useState<WakeTimeOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<WakeTimeOption | null>(
    null,
  );

  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    backgroundColor: interpolateColor(
      buttonScale.value,
      [0.96, 1],
      ['#5e54d8', '#6366f1'],
    ),
  }));

  const breath = useSharedValue(1);
  const breathingIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.1, {
        duration: 4000,
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
    const opacity = interpolate(sheetProgress.value, [0, 1], [0, 0.65]);
    return { opacity };
  });

  const openSheet = (option: WakeTimeOption) => {
    setSelectedOption(option);
    sheetProgress.value = withTiming(1, { duration: 300 });
  };

  const closeSheet = () => {
    sheetProgress.value = withTiming(0, { duration: 250 }, (finished) => {
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
      [3, 4, 5, 6, 7],
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
      title: '¡Es hora de despertar!',
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
          <ActivityIndicator color="#6366f1" size="large" />
          <Text style={{ color: '#e5e7eb', marginTop: 15 }}>
            Cargando perfil de sueño…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.buttonContainer}>
        <FloatingDrawerButton />
      </View>
      <View style={styles.content}>
        <GradientBackground />

        {/* --- Header con Icono Animado --- */}
        <View style={styles.header}>
          <Animated.View style={[styles.breathingIcon, breathingIconStyle]}>
            <Text style={styles.breathingIconEmoji}>🌙</Text>
          </Animated.View>
          <Text style={styles.title}>Dormir ahora</Text>
          <Text style={styles.subtitle}>
            Calcula las horas recomendadas para despertar al final de un ciclo
            de sueño, basado en tus preferencias.
          </Text>
        </View>

        {/* --- Botón Principal de Cálculo --- */}
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
              name="bulb-outline"
              size={20}
              color="#f9fafb"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>
              Calcular horarios ideales
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* --- Lista de Opciones --- */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {options.length === 0 ? (
            <View style={styles.helperBox}>
              <Ionicons name="time-outline" size={24} color="#6b7280" />
              <Text style={styles.helperText}>
                Toca el botón de arriba para ver las horas sugeridas para
                despertar.
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
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.card,
                    opt.isRecommended && styles.cardRecommended,
                  ]}
                  onPress={() => openSheet(opt)}
                >
                  <View style={styles.cardContentWrapper}>
                    {/* Columna Izquierda: Hora y Ciclos */}
                    <View>
                      <Text style={styles.cardTime}>
                        {formatTime(opt.wakeDate)}
                      </Text>
                      <Text style={styles.cardCycles}>
                        {opt.cycles} {opt.cycles === 1 ? 'CICLO' : 'CICLOS'}
                      </Text>
                    </View>

                    {/* Columna Derecha: Duración y Chip */}
                    <View style={styles.cardDetails}>
                      <Text style={styles.cardDuration}>
                        {formatDuration(opt.totalMinutes)} de sueño
                      </Text>
                      {opt.isRecommended && (
                        <View style={styles.recommendedChip}>
                          <Text style={styles.recommendedChipText}>
                            ⭐ Mejor Opción
                          </Text>
                        </View>
                      )}
                      <Text style={styles.cardActionNote}>
                        Ventana:
                        {formatTimeRange(opt.windowStart, opt.windowEnd)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* --- Reanimated Sheet --- */}
      {selectedOption && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop con mayor opacidad */}
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>

          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTime}>
                {formatTime(selectedOption.wakeDate)}
              </Text>
              <Text style={styles.sheetLabel}>
                {selectedOption.cycles}
                {selectedOption.cycles === 1 ? 'CICLO' : 'CICLOS'}
              </Text>
            </View>

            <View style={styles.sheetDetails}>
              <DetailRow
                icon="timer-outline"
                label="Duración total de sueño:"
                value={formatDuration(selectedOption.totalMinutes)}
              />
              <DetailRow
                icon="bed-outline"
                label="Tiempo total en cama (TIB):"
                value={formatDuration(Math.round(selectedOption.tibMinutes))}
              />
              <DetailRow
                icon="sync-outline"
                label="Eficiencia estimada:"
                value={`${(selectedOption.efficiency * 100).toFixed(0)} %`}
              />
              <DetailRow
                icon="sunny-outline"
                label="Ventana ideal para despertar:"
                value={formatTimeRange(
                  selectedOption.windowStart,
                  selectedOption.windowEnd,
                )}
              />
            </View>

            <Text style={styles.sheetText}>
              Esta hora te permite despertar al final de un **ciclo de sueño
              ligero**. Evitar despertar en sueño profundo te ayudará a sentirte
              menos aturdido y más energizado.
            </Text>

            <TouchableOpacity
              style={styles.sheetButtonPrimary}
              activeOpacity={0.9}
              onPress={handleScheduleWakeNotification}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#022c22"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sheetButtonPrimaryText}>
                Programar Alerta de Despertar
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
    </SafeAreaView>
  );
};

const DetailRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View style={detailRowStyles.row}>
    <Ionicons
      name={icon}
      size={18}
      color="#9ca3af"
      style={detailRowStyles.icon}
    />
    <Text style={detailRowStyles.label}>{label}</Text>
    <Text style={detailRowStyles.value}>{value}</Text>
  </View>
);

const detailRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 25,
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
    marginRight: 8,
  },
  value: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});

const PADDING_H = 20;

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
    top: 5,
    left: 5,
    zIndex: 10,
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
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  breathingIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(99,102,241,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.5)',
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
  primaryButtonWrapper: {
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
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
    color: '#f9fafb',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
  },
  secondaryButtonText: {
    color: '#a5b4fc',
    fontSize: 15,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: '#4f46e5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  cardRecommended: {
    borderLeftColor: '#10b981',
    backgroundColor: 'rgba(30,58,40,0.8)',
  },
  cardContentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardCycles: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardDetails: {
    alignItems: 'flex-end',
  },
  cardDuration: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardActionNote: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 6,
  },
  recommendedChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.15)',
    marginBottom: 4,
  },
  recommendedChipText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.7)',
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 18,
    alignItems: 'center',
  },
  sheetLabel: {
    color: '#a5b4fc',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  sheetTime: {
    color: '#e5e7eb',
    fontSize: 40,
    fontWeight: '900',
    marginBottom: 4,
  },
  sheetDetails: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#374151',
    paddingVertical: 15,
    marginBottom: 20,
  },
  sheetText: {
    color: '#cbd5e1',
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  sheetButtonPrimary: {
    marginTop: 16,
    marginBottom: 10,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sheetButtonPrimaryText: {
    color: '#022c22',
    fontSize: 16,
    fontWeight: '800',
  },
  sheetButton: {
    marginTop: 4,
    alignSelf: 'stretch',
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  sheetButtonText: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },
});
