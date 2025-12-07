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
  getSleepTimesForWakeDate,
  formatTime,
  formatDuration,
} from '../utils/sleep';
import { GradientBackground } from '../components/GradientBackground';
import { SleepTimeOption } from '../types/WakeTimeOptions';

type Props = NativeStackScreenProps<RootStackParamList, 'WakeAt'>;

export const WakeAtScreen: FC<Props> = ({ navigation }) => {
  // Hora objetivo de despertar (por defecto: dentro de 8 horas)
  const initialWake = (() => {
    const now = new Date();
    now.setMinutes(0);
    return new Date(now.getTime() + 8 * 60 * 60 * 1000);
  })();

  const [wakeDate, setWakeDate] = useState<Date>(initialWake);
  const [options, setOptions] = useState<SleepTimeOption[]>([]);

  // Icono respirando
  const breath = useSharedValue(1);
  const breathingIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.08, { duration: 2800 }),
      -1,
      true
    );
  }, [breath]);

  // Botón animado
  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleCalculate = () => {
    const sleepOptions = getSleepTimesForWakeDate(wakeDate, [3, 4, 5, 6]);
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

  return (
    <View style={styles.container}>
      <GradientBackground />

      <View style={styles.content}>
        {/* Header con icono */}
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

        {/* Picker de hora simple */}
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

        {/* Mostrar hora completa seleccionada */}
        <Text style={styles.currentWakeText}>
          Despertarás a las{' '}
          <Text style={styles.currentWakeTime}>{formatTime(wakeDate)}</Text>
        </Text>

        {/* Botón calcular */}
        <Animated.View style={[styles.primaryButton, animatedButtonStyle]}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButtonInner}
            onPressIn={() => {
              buttonScale.value = withSpring(0.94, { damping: 15, stiffness: 200 });
            }}
            onPressOut={() => {
              buttonScale.value = withSpring(1, { damping: 15, stiffness: 200 });
            }}
            onPress={handleCalculate}
          >
            <Text style={styles.primaryButtonText}>Calcular hora para dormir</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Botón volver */}
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Volver a “Dormir ahora”</Text>
        </TouchableOpacity>

        {/* Resultados */}
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
              .reverse() // para que se vea primero el más largo (más ciclos)
              .map((opt, index) => (
                <Animated.View
                  key={opt.cycles}
                  entering={FadeInUp.delay(index * 90).springify().damping(14)}
                  style={styles.card}
                >
                  <Text style={styles.cardLabel}>
                    {opt.cycles}{' '}
                    {opt.cycles === 1 ? 'ciclo' : 'ciclos'} de sueño
                  </Text>
                  <Text style={styles.cardTime}>{formatTime(opt.sleepDate)}</Text>
                  <Text style={styles.cardDuration}>
                    Deberías dormir aprox. a esta hora para completar{' '}
                    {formatDuration(opt.totalMinutes)} + 15 min para conciliar.
                  </Text>
                  <Text style={styles.cardNote}>
                    Considera acostarte unos minutos antes para evitar retrasos y
                    mantener una rutina constante.
                  </Text>
                </Animated.View>
              ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
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
  card: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.4)',
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
});
