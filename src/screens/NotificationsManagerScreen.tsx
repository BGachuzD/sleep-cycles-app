// src/screens/NotificationsManagerScreen.tsx
import React, { FC, useCallback, useMemo, useState } from 'react';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { usePressScale } from '../hooks/usePressScale';
import {
  cancelAllNotifications,
  cancelNotification,
  listScheduledNotifications,
} from '../notifications/scheduler';
import { formatTime } from '../utils/sleep';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

type NotificationRequest = Notifications.NotificationRequest;

function getTriggerDate(trigger: NotificationRequest['trigger']): Date | null {
  if (!trigger || typeof trigger !== 'object') return null;
  if (!('date' in trigger)) return null;

  const rawDate = (trigger as { date?: string | number | Date }).date;
  if (!rawDate) return null;
  return rawDate instanceof Date ? rawDate : new Date(rawDate);
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'mañana';
  if (diffDays === -1) return 'ayer';
  if (diffDays > 1 && diffDays <= 6) {
    return date.toLocaleDateString('es-MX', { weekday: 'long' });
  }
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

// ─────────────────────────────────────────────
// NotificationCard
// ─────────────────────────────────────────────
const NotificationCard: FC<{
  request: NotificationRequest;
  onCancel: () => void;
  theme: AppTheme;
}> = ({ request, onCancel, theme }) => {
  const trash = usePressScale(0.85);
  const triggerDate = getTriggerDate(request.trigger);
  const timeString = triggerDate ? formatTime(triggerDate) : '—';
  const relativeString = triggerDate ? formatRelativeDate(triggerDate) : 'sin fecha';
  const isPast = triggerDate ? triggerDate.getTime() < Date.now() : false;

  const title = request.content?.title ?? 'Recordatorio';
  const body = request.content?.body ?? 'Sin descripción';

  return (
    <View
      style={[
        cardStyles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          opacity: isPast ? 0.6 : 1,
        },
      ]}
    >
      <View style={cardStyles.row}>
        <View
          style={[
            cardStyles.iconCircle,
            { backgroundColor: `${theme.colors.accent[500]}1F` },
          ]}
        >
          <Ionicons
            name="alarm-outline"
            size={20}
            color={theme.colors.accent[400]}
          />
        </View>

        <View style={cardStyles.titleCol}>
          <Text
            style={[
              cardStyles.title,
              { color: theme.colors.textPrimary, fontSize: theme.type.bodyLarge },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={[
              cardStyles.body,
              { color: theme.colors.textSecondary, fontSize: theme.type.small },
            ]}
            numberOfLines={2}
          >
            {body}
          </Text>
        </View>

        <Animated.View style={trash.animatedStyle}>
          <Pressable
            onPress={onCancel}
            onPressIn={trash.onPressIn}
            onPressOut={trash.onPressOut}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancelar alerta"
            style={[
              cardStyles.trashBtn,
              {
                backgroundColor: `${theme.colors.danger}14`,
                borderColor: `${theme.colors.danger}33`,
              },
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={theme.colors.danger}
            />
          </Pressable>
        </Animated.View>
      </View>

      <View
        style={[
          cardStyles.timeRow,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <View style={cardStyles.timeLeft}>
          <Text
            style={[
              cardStyles.timeLabel,
              { color: theme.colors.textMuted, fontSize: theme.type.micro },
            ]}
          >
            DISPARO
          </Text>
          <Text
            style={[
              cardStyles.timeValue,
              { color: theme.colors.heroText, fontSize: theme.type.title3 },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {timeString}
          </Text>
        </View>
        <View
          style={[
            cardStyles.dateChip,
            {
              backgroundColor: `${theme.colors.accent[500]}1F`,
              borderColor: `${theme.colors.accent[500]}55`,
              borderRadius: 999,
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={12}
            color={theme.colors.accent[400]}
          />
          <Text
            style={[
              cardStyles.dateChipText,
              { color: theme.colors.accent[300], fontSize: theme.type.caption },
            ]}
          >
            {relativeString}
          </Text>
        </View>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: { borderWidth: 1, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCol: { flex: 1, gap: 2 },
  title: { fontWeight: '800' },
  body: { lineHeight: 18 },
  trashBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  timeLeft: { flex: 1, gap: 2 },
  timeLabel: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  timeValue: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  dateChipText: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'lowercase',
  },
});

// ─────────────────────────────────────────────
// NotificationsManagerScreen
// ─────────────────────────────────────────────
export const NotificationsManagerScreen: FC = () => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [items, setItems] = useState<NotificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const scheduled = await listScheduledNotifications();
    // ordenar por fecha de disparo ascendente
    scheduled.sort((a, b) => {
      const da = getTriggerDate(a.trigger)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = getTriggerDate(b.trigger)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });
    setItems(scheduled);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleCancel = useCallback(
    (request: NotificationRequest) => {
      const title = request.content?.title ?? 'Recordatorio';
      Alert.alert(
        'Cancelar alerta',
        `¿Cancelar "${title}"?`,
        [
          { text: 'Conservar', style: 'cancel' },
          {
            text: 'Cancelar alerta',
            style: 'destructive',
            onPress: async () => {
              await cancelNotification(request.identifier);
              load();
            },
          },
        ],
      );
    },
    [load],
  );

  const handleCancelAll = useCallback(() => {
    Alert.alert(
      'Cancelar todas',
      `Se cancelarán ${items.length} alertas programadas. ¿Continuar?`,
      [
        { text: 'Conservar', style: 'cancel' },
        {
          text: 'Cancelar todas',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            load();
          },
        },
      ],
    );
  }, [items.length, load]);

  const refresh = usePressScale(0.9);

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
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>ALERTAS PROGRAMADAS</Text>
              <Text style={styles.heroTitle}>
                {isLoading
                  ? 'Cargando…'
                  : items.length === 0
                    ? 'Sin alertas'
                    : `${items.length} ${items.length === 1 ? 'alerta activa' : 'alertas activas'}`}
              </Text>
              <Text style={styles.heroSubtitle}>
                Recordatorios y alarmas inteligentes que disparará la app.
              </Text>
            </View>
            <Animated.View style={refresh.animatedStyle}>
              <Pressable
                onPress={load}
                onPressIn={refresh.onPressIn}
                onPressOut={refresh.onPressOut}
                disabled={isLoading}
                hitSlop={8}
                style={styles.refreshBtn}
                accessibilityRole="button"
                accessibilityLabel="Refrescar alertas"
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.accent[400]}
                  />
                ) : (
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={theme.colors.accent[400]}
                  />
                )}
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <Animated.View entering={FadeInUp.delay(80).duration(500)}>
            <View style={styles.emptyBox}>
              <Ionicons
                name="notifications-off-outline"
                size={36}
                color={theme.colors.textMuted}
              />
              <Text style={styles.emptyText}>
                No tienes alarmas ni recordatorios de sueño pendientes.
                Programa una desde "Dormir ahora", "Despertar a" o tu rutina.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Lista */}
        {items.length > 0 && (
          <View style={styles.list}>
            {items.map((request, index) => (
              <Animated.View
                key={request.identifier}
                entering={FadeInUp.delay(80 + index * 40).duration(400)}
              >
                <NotificationCard
                  request={request}
                  onCancel={() => handleCancel(request)}
                  theme={theme}
                />
              </Animated.View>
            ))}
          </View>
        )}

        {/* Cancel all */}
        {items.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Pressable
              onPress={handleCancelAll}
              style={[
                styles.cancelAllBtn,
                {
                  borderColor: `${theme.colors.danger}55`,
                  backgroundColor: `${theme.colors.danger}0F`,
                  borderRadius: theme.radius.lg,
                },
              ]}
              accessibilityRole="button"
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={theme.colors.danger}
              />
              <Text style={styles.cancelAllText}>
                Cancelar todas ({items.length})
              </Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.xxl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    hero: { gap: 4 },
    heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    heroTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title2,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginTop: 4,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 6,
    },
    refreshBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: 6,
    },
    emptyBox: {
      alignItems: 'center',
      gap: 12,
      paddingVertical: theme.spacing.huge,
      paddingHorizontal: theme.spacing.xxl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: theme.type.small,
      textAlign: 'center',
      lineHeight: 18,
    },
    list: { gap: theme.spacing.md },
    cancelAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
      marginTop: theme.spacing.sm,
    },
    cancelAllText: {
      color: theme.colors.danger,
      fontSize: theme.type.body,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
