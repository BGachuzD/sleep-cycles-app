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

import {
  listScheduledNotifications,
  cancelNotification,
  cancelAllNotifications,
} from '../notifications/scheduler';
import { formatTime } from '../utils/sleep';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';

// Usamos el tipo oficial de Expo
type NotificationRequest = Notifications.NotificationRequest;

export const NotificationsManagerScreen = () => {
  const [items, setItems] = useState<NotificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const scheduled = await listScheduledNotifications(); // NotificationRequest[]
    setItems(scheduled);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id: string) => {
    await cancelNotification(id);
    load();
  };

  const handleCancelAll = async () => {
    await cancelAllNotifications();
    load();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Gestión de Alertas</Text>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color="#38bdf8"
            style={{ marginTop: 50 }}
          />
        )}

        {!isLoading && items.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={50}
              color="#64748b"
            />
            <Text style={styles.noText}>
              No tienes alarmas ni recordatorios de sueño pendientes.
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {items.map((n) => {
            const id = n.identifier;

            // ---- Resolver el trigger como fecha (si aplica) ----
            let triggerDate: Date | null = null;

            const trigger = n.trigger;

            // Para triggers tipo "date"
            if (
              trigger &&
              trigger.type ===
                Notifications.ScheduledNotificationTriggerType.DATE
            ) {
              const dateValue = trigger.date; // puede ser Date | string
              triggerDate =
                dateValue instanceof Date ? dateValue : new Date(dateValue);
            }

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
                    color="#38bdf8"
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
                    color="#fff"
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
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.cancelAllText}>
                Cancelar todas las notificaciones ({items.length})
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <FloatingDrawerButton />
      </View>
    </SafeAreaView>
  );
};

// ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  noText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
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
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  itemBody: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 2,
  },
  timeContainer: {
    backgroundColor: '#334155',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
  },
  timeValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
  },
  dateText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  itemButton: {
    marginTop: 15,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  itemButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelAllButton: {
    marginTop: 30,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelAllText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
