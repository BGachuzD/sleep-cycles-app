// src/screens/NotificationsManagerScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { GradientBackground } from '../components/GradientBackground';
import { EmptyState, useToast } from '../components/ui';
import { usePressScale } from '../hooks/usePressScale';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import {
  cancelNotification,
  listScheduledNotifications,
} from '../notifications/scheduler';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  getTriggerDate,
  isRecurringSystemReminder,
  type NotificationRequest,
} from './notificationsManager/helpers';
import { NotificationCard } from './notificationsManager/NotificationCard';

// ─────────────────────────────────────────────
// NotificationsManagerScreen
// ─────────────────────────────────────────────
export const NotificationsManagerScreen: FC = () => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomContentPadding = useTabBarContentPadding();
  const { showToast } = useToast();

  const [items, setItems] = useState<NotificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const scheduled = (await listScheduledNotifications()).filter(
      (r) => !isRecurringSystemReminder(r.trigger),
    );
    // ordenar por fecha de envío ascendente
    scheduled.sort((a, b) => {
      const da =
        getTriggerDate(a.trigger)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db =
        getTriggerDate(b.trigger)?.getTime() ?? Number.MAX_SAFE_INTEGER;
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
      Alert.alert('Cancelar alerta', `¿Cancelar "${title}"?`, [
        { text: 'Conservar', style: 'cancel' },
        {
          text: 'Cancelar alerta',
          style: 'destructive',
          onPress: async () => {
            await cancelNotification(request.identifier);
            await load();
            showToast({
              title: 'Alerta cancelada',
              message: title,
              tone: 'info',
            });
          },
        },
      ]);
    },
    [load, showToast],
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
            // Solo las alertas listadas: el recordatorio diario oculto
            // (gestionado por la app) debe sobrevivir. Secuencial porque
            // cancelNotification lee/escribe el mapa persistido.
            for (const request of items) {
              await cancelNotification(request.identifier);
            }
            load();
          },
        },
      ],
    );
  }, [items, load]);

  const refresh = usePressScale(0.9);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.hero}>
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
                Recordatorios y alarmas inteligentes que la app te enviará.
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
          <Animated.View entering={FadeInUp.delay(80).duration(260)}>
            <EmptyState
              icon="notifications-off-outline"
              title="Todo está tranquilo"
              description={
                'No tienes alarmas pendientes. Programa una desde “Dormir ahora”, “Despertar a” o tu rutina.'
              }
            />
          </Animated.View>
        )}

        {/* Lista */}
        {items.length > 0 && (
          <View style={styles.list}>
            {items.map((request, index) => (
              <Animated.View
                key={request.identifier}
                entering={FadeInUp.delay(
                  Math.min(80 + index * 24, 120),
                ).duration(240)}
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
          <Animated.View entering={FadeInUp.delay(120).duration(240)}>
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
      fontWeight: '700',
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
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
