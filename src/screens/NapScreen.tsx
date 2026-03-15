// src/screens/NapScreen.tsx
import React, { FC, useState, useMemo } from 'react';
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
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { scheduleSmartWakeAlarm } from '../notifications/scheduler';
import { formatTime } from '../utils/sleep';

interface NapOption {
  id: string;
  label: string;
  emoji: string;
  durationMinutes: number;
  description: string;
  color: string;
  tip: string;
}

const NAP_OPTIONS: NapOption[] = [
  {
    id: 'power',
    label: 'Power Nap',
    emoji: '⚡',
    durationMinutes: 20,
    description: 'Siesta corta sin entrar en sueño profundo. Te recargas sin inercia de sueño.',
    color: '#fbbf24',
    tip: 'Ideal antes de las 3pm. Programa la alarma justo ahora.',
  },
  {
    id: 'refresh',
    label: 'Siesta de recuperación',
    emoji: '🔋',
    durationMinutes: 60,
    description: 'Un ciclo parcial. Puede haber algo de inercia al despertar.',
    color: '#f97316',
    tip: 'Útil si tienes una o dos horas disponibles. Despierta antes de entrar en sueño profundo.',
  },
  {
    id: 'full',
    label: 'Ciclo completo',
    emoji: '🌙',
    durationMinutes: 90,
    description: 'Un ciclo completo de sueño. Despertarás en sueño ligero y te sentirás renovado.',
    color: '#818cf8',
    tip: 'La opción más completa. Asegúrate de tener 90 min disponibles.',
  },
  {
    id: 'double',
    label: 'Doble ciclo',
    emoji: '💤',
    durationMinutes: 180,
    description: 'Dos ciclos completos. Para cuando necesitas compensar deuda de sueño.',
    color: '#a78bfa',
    tip: 'Solo si tienes 3 horas. Puede afectar el sueño nocturno si es tarde.',
  },
];

export const NapScreen: FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<Record<string, string>>({});

  const selectedOption = useMemo(
    () => NAP_OPTIONS.find((o) => o.id === selectedId) ?? null,
    [selectedId],
  );

  const handleSchedule = async (option: NapOption) => {
    const now = new Date();
    const wakeTime = new Date(now.getTime() + option.durationMinutes * 60 * 1000);
    // window: ±10 min around wake time
    const windowStart = new Date(wakeTime.getTime() - 10 * 60 * 1000);
    const windowEnd = new Date(wakeTime.getTime() + 10 * 60 * 1000);

    const { centerId } = await scheduleSmartWakeAlarm({
      keyBase: `nap:${option.id}`,
      windowStart,
      windowEnd,
    });

    if (!centerId) {
      Alert.alert('Error', 'No se pudo programar. Revisa los permisos de notificación.');
      return;
    }

    setScheduled((prev) => ({ ...prev, [option.id]: formatTime(wakeTime) }));
    Alert.alert(
      '¡Siesta programada!',
      `Despertarás a las ${formatTime(wakeTime)} (ventana ${formatTime(windowStart)}–${formatTime(windowEnd)})`,
    );
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
          <Text style={styles.title}>Modo siesta</Text>
          <Text style={styles.subtitle}>
            Elige cuánto tiempo tienes. Programamos tu alarma para que despiertes en el momento justo.
          </Text>
        </View>

        {/* Nap options */}
        {NAP_OPTIONS.map((option, index) => {
          const isSelected = selectedId === option.id;
          const scheduledTime = scheduled[option.id];
          const wakeEta = new Date(
            Date.now() + option.durationMinutes * 60 * 1000,
          );

          return (
            <Animated.View
              key={option.id}
              entering={FadeInUp.delay(index * 80).springify().damping(14)}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  isSelected && { borderColor: option.color, borderWidth: 2 },
                ]}
                onPress={() => setSelectedId(isSelected ? null : option.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.emojiCircle, { backgroundColor: option.color + '25' }]}>
                    <Text style={styles.cardEmoji}>{option.emoji}</Text>
                  </View>
                  <View style={styles.cardTextCol}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardLabel}>{option.label}</Text>
                      <View style={[styles.durationBadge, { backgroundColor: option.color + '25' }]}>
                        <Text style={[styles.durationBadgeText, { color: option.color }]}>
                          {option.durationMinutes} min
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardDesc}>{option.description}</Text>
                    <Text style={styles.wakeEta}>
                      Despertarías a las {formatTime(wakeEta)}
                    </Text>
                  </View>
                </View>

                {isSelected && (
                  <Animated.View entering={FadeInUp.duration(300)}>
                    <View style={styles.expandedContent}>
                      <View style={styles.tipBox}>
                        <Ionicons name="information-circle-outline" size={14} color={option.color} style={{ marginRight: 6 }} />
                        <Text style={[styles.tipText, { color: option.color }]}>{option.tip}</Text>
                      </View>

                      {scheduledTime ? (
                        <View style={styles.scheduledBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#34d399" style={{ marginRight: 6 }} />
                          <Text style={styles.scheduledText}>Alarma programada para las {scheduledTime}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.scheduleBtn, { backgroundColor: option.color }]}
                          onPress={() => handleSchedule(option)}
                        >
                          <Ionicons
                            name="alarm-outline"
                            size={16}
                            color={option.id === 'power' ? '#1f1300' : '#0f0f2e'}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[styles.scheduleBtnText, { color: option.id === 'power' ? '#1f1300' : '#0f0f2e' }]}>
                            Programar alarma ahora
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Sleep science note */}
        <View style={styles.scienceCard}>
          <Ionicons name="flask-outline" size={16} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={styles.scienceText}>
            Las siestas de 20 min mejoran el estado de alerta sin causar inercia de sueño. Las de 90 min completan un ciclo y maximizan la recuperación cognitiva.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { color: '#e0e7ff', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#9ca3af', fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#374151',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  cardTop: { flexDirection: 'row', gap: 14 },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 26 },
  cardTextCol: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardLabel: { color: '#e5e7eb', fontSize: 15, fontWeight: '800' },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  durationBadgeText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { color: '#9ca3af', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  wakeEta: { color: '#6b7280', fontSize: 11 },
  expandedContent: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 12 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  tipText: { fontSize: 12, lineHeight: 18, flex: 1 },
  scheduleBtn: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scheduleBtnText: { fontSize: 14, fontWeight: '800' },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#34d39940',
  },
  scheduledText: { color: '#34d399', fontSize: 13, fontWeight: '600' },
  scienceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  scienceText: { color: '#4b5563', fontSize: 12, lineHeight: 18, flex: 1 },
});
