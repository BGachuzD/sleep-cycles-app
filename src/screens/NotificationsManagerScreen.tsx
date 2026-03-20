// src/screens/NotificationsManagerScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';

import {
  listScheduledNotifications,
  cancelNotification,
  cancelAllNotifications,
} from '../notifications/scheduler';
import { formatTime } from '../utils/sleep';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
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

export const NotificationsManagerScreen = () => {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [items, setItems] = useState<NotificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const scheduled = await listScheduledNotifications();
    setItems(scheduled);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, []),
  );

  const handleCancel = async (id: string) => {
    await cancelNotification(id);
    load();
  };

  const handleCancelAll = async () => {
    await cancelAllNotifications();
    load();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />
      <View style={styles.container}>
        <Text style={styles.title}>Gestión de Alertas</Text>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color={theme.colors.info}
            style={{ marginTop: 50 }}
          />
        )}

        {!isLoading && items.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={50}
              color={theme.colors.textMuted}
            />
            <Text style={styles.noText}>
              No tienes alarmas ni recordatorios de sueño pendientes.
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {items.map((n) => {
            const id = n.identifier;
            const triggerDate = getTriggerDate(n.trigger);

            const timeString = triggerDate ? formatTime(triggerDate) : 'N/A';
            const dateString = triggerDate
              ? triggerDate.toLocaleDateString()
              : 'N/A';

            return (
              <View key={id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Ionicons
                    name="alarm-outline"
                    size={24}
                    color={theme.colors.info}
                    style={styles.itemIcon}
                  />
                  <View style={styles.itemTitleGroup}>
                    <Text style={styles.itemTitle}>
                      {n.content?.title || 'Recordatorio'}
                    </Text>
                    <Text style={styles.itemBody}>
                      {n.content?.body || 'Sin descripción'}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeContainer}>
                  <Text style={styles.timeLabel}>DISPARO:</Text>
                  <Text style={styles.timeValue}>{timeString}</Text>
                  <Text style={styles.dateText}>el {dateString}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleCancel(id)}
                  style={styles.itemButton}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={theme.colors.white}
                  />
                  <Text style={styles.itemButtonText}>Cancelar Alerta</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {items.length > 0 && (
            <TouchableOpacity
              onPress={handleCancelAll}
              style={styles.cancelAllButton}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.white} />
              <Text style={styles.cancelAllText}>
                Cancelar todas las notificaciones ({items.length})
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 10,
    paddingTop: 64,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  noText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemTitleGroup: {
    flex: 1,
  },
  itemTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  itemBody: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  timeContainer: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
  },
  timeValue: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  itemButton: {
    marginTop: 15,
    backgroundColor: theme.colors.danger,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  itemButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  cancelAllButton: {
    marginTop: 30,
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelAllText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
