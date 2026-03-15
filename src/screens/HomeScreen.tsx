// src/screens/HomeScreen.tsx
import React, { FC, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { useSleepLogContext } from '../context/SleepLogContext';
import { useAuth } from '../context/AuthContext';
import {
  getWakeTimesFromNowForProfile,
  formatTime,
  formatDuration,
} from '../utils/sleep';
import {
  computeStats,
  computeSleepMinutes,
  computeCompleteCycles,
  todayDateString,
} from '../domain/sleepLog';
import { getOptimalSleepWindow } from '../domain/sleepProfile';
import type { AppDrawerParamList } from '../navigation/AppDrawerNavigator';

type TimeContext = 'evening' | 'night' | 'morning' | 'afternoon';

function getTimeContext(hour: number): TimeContext {
  if (hour >= 18 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 4) return 'night';
  if (hour >= 4 && hour < 12) return 'morning';
  return 'afternoon';
}

const TIME_CONFIG = {
  evening: {
    greeting: 'Buenas noches',
    emoji: '🌆',
    message: 'Es un buen momento para planear tu descanso.',
    color: '#f97316',
    actionLabel: '¿A qué hora quiero despertar?',
    actionScreen: 'WakeAt' as keyof AppDrawerParamList,
    actionIcon: 'alarm-outline' as const,
  },
  night: {
    greeting: 'Hora de dormir',
    emoji: '🌙',
    message: 'Calcula cuándo despertar si te duermes ahora.',
    color: '#818cf8',
    actionLabel: 'Dormir ahora',
    actionScreen: 'SleepNow' as keyof AppDrawerParamList,
    actionIcon: 'moon-outline' as const,
  },
  morning: {
    greeting: '¡Buenos días!',
    emoji: '☀️',
    message: 'Registra cómo dormiste esta noche.',
    color: '#fbbf24',
    actionLabel: 'Registrar mi sueño',
    actionScreen: 'SleepLog' as keyof AppDrawerParamList,
    actionIcon: 'journal-outline' as const,
  },
  afternoon: {
    greeting: 'Buenas tardes',
    emoji: '🌤',
    message: 'Planea tu rutina para esta noche.',
    color: '#34d399',
    actionLabel: 'Ver mi rutina de esta noche',
    actionScreen: 'SleepRoutine' as keyof AppDrawerParamList,
    actionIcon: 'list-outline' as const,
  },
};

export const HomeScreen: FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AppDrawerParamList>>();
  const { profile } = useSleepProfileContext();
  const { entries } = useSleepLogContext();
  const { user } = useAuth();

  const now = useMemo(() => new Date(), []);
  const hour = now.getHours();
  const timeCtx = getTimeContext(hour);
  const config = TIME_CONFIG[timeCtx];

  const breath = useSharedValue(1);
  useEffect(() => {
    breath.value = withRepeat(withTiming(1.08, { duration: 4000 }), -1, true);
  }, [breath]);
  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  // Mejor opción de sueño si es de noche
  const bestOption = useMemo(() => {
    if (!profile || (timeCtx !== 'night' && timeCtx !== 'evening')) return null;
    const opts = getWakeTimesFromNowForProfile(profile, now, [4, 5, 6]);
    return opts.find((o) => o.isRecommended) ?? opts[opts.length - 1];
  }, [profile, now, timeCtx]);

  // Última entrada del log para mostrar si es mañana
  const lastEntry = entries[0] ?? null;
  const isLoggedToday = lastEntry?.date === todayDateString();

  const stats = useMemo(() => {
    const cycleMins = profile?.age
      ? profile.age < 18
        ? 95
        : profile.age > 60
          ? 85
          : 90
      : 90;
    return computeStats(entries, cycleMins);
  }, [entries, profile]);

  const displayName = user?.user_metadata?.display_name as string | undefined;
  const optWindow = getOptimalSleepWindow(profile?.chronotype);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.greetingRow}
        >
          <Animated.View
            style={[
              styles.emojiCircle,
              breathStyle,
              { borderColor: config.color + '80' },
            ]}
          >
            <Text style={styles.emojiText}>{config.emoji}</Text>
          </Animated.View>
          <View style={styles.greetingTextCol}>
            <Text style={styles.greeting}>{config.greeting}</Text>
            {displayName && (
              <Text style={[styles.name, { color: config.color }]}>
                {displayName}
              </Text>
            )}
            <Text style={styles.contextMsg}>{config.message}</Text>
          </View>
        </Animated.View>

        {/* Quick action card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: config.color }]}
            onPress={() => navigation.navigate(config.actionScreen as any)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={config.actionIcon}
              size={22}
              color={config.color}
              style={{ marginRight: 12 }}
            />
            <Text style={[styles.actionLabel, { color: config.color }]}>
              {config.actionLabel}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={config.color}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Best sleep option tonight (evening/night only) */}
        {bestOption && (
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Opción recomendada para hoy</Text>
              <View style={styles.bestOptionRow}>
                <View>
                  <Text style={styles.bigTime}>
                    {formatTime(bestOption.wakeDate)}
                  </Text>
                  <Text style={styles.smallText}>
                    {bestOption.cycles} ciclos ·{' '}
                    {formatDuration(bestOption.totalMinutes)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.goBtn}
                  onPress={() => navigation.navigate('SleepNow' as any)}
                >
                  <Text style={styles.goBtnText}>Ver opciones</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Last log entry (morning only) */}
        {timeCtx === 'morning' && (
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            {isLoggedToday && lastEntry ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Esta noche dormiste</Text>
                <Text style={styles.bigTime}>
                  {formatDuration(computeSleepMinutes(lastEntry))}
                </Text>
                <Text style={styles.smallText}>
                  {computeCompleteCycles(
                    computeSleepMinutes(lastEntry),
                    profile?.age && profile.age > 60
                      ? 85
                      : profile?.age && profile.age < 18
                        ? 95
                        : 90,
                  )}{' '}
                  ciclos completos
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.card, styles.logPromptCard]}
                onPress={() => navigation.navigate('SleepLog' as any)}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color="#fbbf24"
                  style={{ marginBottom: 6 }}
                />
                <Text style={styles.logPromptText}>
                  ¿Ya registraste tu sueño de anoche?
                </Text>
                <Text style={styles.logPromptSub}>Toca para registrar</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Optimal window for chronotype */}
        {profile?.chronotype && (
          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color="#a78bfa"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.cardLabel}>
                  Ventana óptima · {optWindow.label}
                </Text>
              </View>
              <Text style={styles.windowText}>
                Dormir: {optWindow.bedtimeStart} – {optWindow.bedtimeEnd}
              </Text>
              <Text style={styles.windowText}>
                Despertar: {optWindow.wakeStart} – {optWindow.wakeEnd}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Weekly summary */}
        {stats.totalDays > 0 && (
          <Animated.View entering={FadeInDown.delay(280).duration(500)}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Stats' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons
                  name="bar-chart-outline"
                  size={16}
                  color="#34d399"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.cardLabel}>Resumen semanal</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="#6b7280"
                  style={{ marginLeft: 'auto' }}
                />
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatDuration(stats.avgSleepMinutes)}
                  </Text>
                  <Text style={styles.statLabel}>promedio</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.avgCycles}</Text>
                  <Text style={styles.statLabel}>ciclos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text
                    style={[
                      styles.statValue,
                      stats.currentStreak > 0 && { color: '#f97316' },
                    ]}
                  >
                    🔥 {stats.currentStreak}
                  </Text>
                  <Text style={styles.statLabel}>racha</Text>
                </View>
              </View>
              {stats.debtMinutes > 0 && (
                <View style={styles.debtBadge}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color="#f87171"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.debtText}>
                    Deuda de sueño: {formatDuration(stats.debtMinutes)} esta
                    semana
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick nav grid */}
        <Animated.View
          entering={FadeInDown.delay(340).duration(500)}
          style={styles.quickGrid}
        >
          {[
            {
              label: 'Dormir ahora',
              icon: 'moon-outline',
              screen: 'SleepNow',
              color: '#818cf8',
            },
            {
              label: 'Despertar a',
              icon: 'alarm-outline',
              screen: 'WakeAt',
              color: '#60a5fa',
            },
            {
              label: 'Siesta',
              icon: 'bed-outline',
              screen: 'Nap',
              color: '#f97316',
            },
            {
              label: 'Rutina',
              icon: 'list-outline',
              screen: 'SleepRoutine',
              color: '#34d399',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.quickItem}
              onPress={() => navigation.navigate(item.screen as any)}
            >
              <Ionicons name={item.icon as any} size={22} color={item.color} />
              <Text style={[styles.quickLabel, { color: item.color }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  emojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    backgroundColor: 'rgba(15,23,42,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 34 },
  greetingTextCol: { flex: 1 },
  greeting: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  contextMsg: { color: '#6b7280', fontSize: 13, marginTop: 4, lineHeight: 18 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    borderLeftWidth: 4,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  actionLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  bigTime: { color: '#f9fafb', fontSize: 36, fontWeight: '900', marginTop: 4 },
  smallText: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  bestOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  goBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  goBtnText: { color: '#e0e7ff', fontSize: 13, fontWeight: '700' },
  logPromptCard: { alignItems: 'center', paddingVertical: 24 },
  logPromptText: {
    color: '#fbbf24',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  logPromptSub: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  windowText: {
    color: '#c4b5fd',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#e5e7eb', fontSize: 18, fontWeight: '900' },
  statLabel: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#374151' },
  debtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  debtText: { color: '#f87171', fontSize: 12, fontWeight: '600' },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  quickItem: {
    width: '47%',
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  quickLabel: { fontSize: 13, fontWeight: '700' },
});
