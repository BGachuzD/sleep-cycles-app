// src/screens/SleepRoutineScreen.tsx
import React, { FC, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { getOptimalSleepWindow } from '../domain/sleepProfile';
import { formatTime } from '../utils/sleep';
import { scheduleUniqueNotificationAtDate } from '../notifications/scheduler';

interface RoutineStep {
  minutesBefore: number; // minutos antes de la hora de dormir
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const ROUTINE_STEPS: RoutineStep[] = [
  {
    minutesBefore: 120,
    icon: 'tv-outline',
    title: 'Reduce pantallas',
    description: 'Baja el brillo de tus dispositivos y activa el modo nocturno.',
    color: '#f97316',
  },
  {
    minutesBefore: 90,
    icon: 'restaurant-outline',
    title: 'Última comida ligera',
    description: 'Evita comidas pesadas. Una infusión caliente puede ayudar.',
    color: '#fbbf24',
  },
  {
    minutesBefore: 60,
    icon: 'notifications-off-outline',
    title: 'Silencia el teléfono',
    description: 'Activa modo No Molestar. Solo emergencias.',
    color: '#a78bfa',
  },
  {
    minutesBefore: 45,
    icon: 'body-outline',
    title: 'Estiramientos suaves',
    description: '5–10 minutos de yoga suave o estiramientos relajantes.',
    color: '#34d399',
  },
  {
    minutesBefore: 30,
    icon: 'book-outline',
    title: 'Lectura o meditación',
    description: 'Lee un libro físico o practica respiración profunda.',
    color: '#60a5fa',
  },
  {
    minutesBefore: 15,
    icon: 'thermometer-outline',
    title: 'Temperatura ideal',
    description: 'La habitación a 18–20 °C favorece el sueño profundo.',
    color: '#818cf8',
  },
  {
    minutesBefore: 0,
    icon: 'moon-outline',
    title: '¡Hora de dormir!',
    description: 'Apaga la luz y cierra los ojos. Tu cuerpo está listo.',
    color: '#c4b5fd',
  },
];

export const SleepRoutineScreen: FC = () => {
  const { profile } = useSleepProfileContext();
  const optWindow = getOptimalSleepWindow(profile?.chronotype);

  // Hora objetivo de dormir: centro de la ventana óptima
  const targetBedTime = useMemo(() => {
    const [sh, sm] = optWindow.bedtimeStart.split(':').map(Number);
    const [eh, em] = optWindow.bedtimeEnd.split(':').map(Number);
    const startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins < startMins) endMins += 24 * 60;
    const centerMins = Math.round((startMins + endMins) / 2) % (24 * 60);
    const h = Math.floor(centerMins / 60) % 24;
    const m = centerMins % 60;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    // Si ya pasó, mover a mañana
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  }, [optWindow]);

  const [scheduledSteps, setScheduledSteps] = useState<Set<number>>(new Set());

  const stepTime = (step: RoutineStep): Date => {
    return new Date(targetBedTime.getTime() - step.minutesBefore * 60 * 1000);
  };

  const handleScheduleAll = async () => {
    let count = 0;
    for (const step of ROUTINE_STEPS) {
      const time = stepTime(step);
      if (time.getTime() > Date.now()) {
        await scheduleUniqueNotificationAtDate({
          key: `routine:${step.minutesBefore}`,
          title: step.title,
          body: step.description,
          date: time,
        });
        count++;
      }
    }
    setScheduledSteps(new Set(ROUTINE_STEPS.map((s) => s.minutesBefore)));
    Alert.alert(
      'Rutina programada',
      `${count} recordatorios configurados para esta noche.`,
    );
  };

  const handleScheduleStep = async (step: RoutineStep) => {
    const time = stepTime(step);
    if (time.getTime() <= Date.now()) {
      Alert.alert('Hora pasada', 'Esta hora ya pasó. Programa para mañana ajustando tu horario.');
      return;
    }
    await scheduleUniqueNotificationAtDate({
      key: `routine:${step.minutesBefore}`,
      title: step.title,
      body: step.description,
      date: time,
    });
    setScheduledSteps((prev) => new Set([...prev, step.minutesBefore]));
    Alert.alert('Recordatorio', `Programado para las ${formatTime(time)}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Rutina pre-sueño</Text>
          <Text style={styles.subtitle}>
            Pasos para prepararte {optWindow.label !== 'Intermedio' ? `(${optWindow.label})` : ''} antes de dormir a las{' '}
            <Text style={styles.targetTime}>{formatTime(targetBedTime)}</Text>
          </Text>
        </View>

        {/* Schedule all button */}
        <TouchableOpacity style={styles.scheduleAllBtn} onPress={handleScheduleAll}>
          <Ionicons name="notifications-outline" size={18} color="#022c22" style={{ marginRight: 8 }} />
          <Text style={styles.scheduleAllText}>Programar toda la rutina</Text>
        </TouchableOpacity>

        {/* Steps timeline */}
        {ROUTINE_STEPS.map((step, index) => {
          const time = stepTime(step);
          const isScheduled = scheduledSteps.has(step.minutesBefore);
          const isPast = time.getTime() <= Date.now();
          const isLast = index === ROUTINE_STEPS.length - 1;

          return (
            <Animated.View
              key={step.minutesBefore}
              entering={FadeInLeft.delay(index * 80).springify().damping(14)}
            >
              <View style={styles.stepRow}>
                {/* Timeline line + dot */}
                <View style={styles.timelineCol}>
                  <View style={[styles.dot, { backgroundColor: step.color }]} />
                  {!isLast && <View style={[styles.line, { backgroundColor: step.color + '40' }]} />}
                </View>

                {/* Content */}
                <TouchableOpacity
                  style={[
                    styles.stepCard,
                    isPast && styles.stepCardPast,
                    isScheduled && styles.stepCardScheduled,
                  ]}
                  onPress={() => handleScheduleStep(step)}
                  activeOpacity={0.8}
                >
                  <View style={styles.stepTop}>
                    <View style={[styles.iconCircle, { backgroundColor: step.color + '20' }]}>
                      <Ionicons name={step.icon} size={18} color={step.color} />
                    </View>
                    <View style={styles.stepTextCol}>
                      <Text style={styles.stepTime}>{formatTime(time)}</Text>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                    </View>
                    {isScheduled ? (
                      <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                    ) : (
                      <Ionicons name="alarm-outline" size={18} color="#4b5563" />
                    )}
                  </View>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                  {step.minutesBefore === 0 && (
                    <View style={styles.bedtimeBadge}>
                      <Text style={styles.bedtimeBadgeText}>⭐ Hora óptima para tu cronotipo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { color: '#e0e7ff', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#9ca3af', fontSize: 14, lineHeight: 20 },
  targetTime: { color: '#a78bfa', fontWeight: '700' },
  scheduleAllBtn: {
    backgroundColor: '#10b981',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
    ...Platform.select({
      ios: { shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  scheduleAllText: { color: '#022c22', fontSize: 15, fontWeight: '800' },
  stepRow: { flexDirection: 'row', marginBottom: 4 },
  timelineCol: { width: 32, alignItems: 'center', paddingTop: 14 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, marginTop: 4 },
  stepCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  stepCardPast: { opacity: 0.45 },
  stepCardScheduled: {
    borderColor: '#34d39940',
    backgroundColor: 'rgba(52,211,153,0.06)',
  },
  stepTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepTextCol: { flex: 1 },
  stepTime: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  stepTitle: { color: '#e5e7eb', fontSize: 14, fontWeight: '700' },
  stepDesc: { color: '#6b7280', fontSize: 13, lineHeight: 18 },
  bedtimeBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#a78bfa40',
  },
  bedtimeBadgeText: { color: '#c4b5fd', fontSize: 11, fontWeight: '700' },
});
