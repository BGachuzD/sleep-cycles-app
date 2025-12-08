import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  listScheduledNotifications,
  cancelNotification,
  cancelAllNotifications,
} from '../notifications/scheduler';
import { formatTime } from '../utils/sleep';
import { SafeAreaView } from 'react-native-safe-area-context';

export const NotificationsManagerScreen = () => {
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const scheduled = await listScheduledNotifications();
    setItems(scheduled);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Notificaciones Programadas</Text>

        {items.length === 0 && (
          <Text style={styles.noText}>No hay notificaciones pendientes.</Text>
        )}

        {items.map((n) => {
          const id = n.identifier;
          const triggerDate = n.trigger?.date ? new Date(n.trigger.date) : null;

          return (
            <View key={id} style={styles.itemContainer}>
              <Text style={styles.itemTitle}>
                {n.content?.title || 'Notificación'}
              </Text>

              <Text style={{ color: '#cbd5e1', marginTop: 4 }}>
                {n.content?.body}
              </Text>

              {triggerDate && (
                <Text style={styles.itemBody}>
                  Se disparará: {formatTime(triggerDate)} (
                  {triggerDate.toLocaleDateString()})
                </Text>
              )}

              <TouchableOpacity
                onPress={async () => {
                  await cancelNotification(id);
                  load();
                }}
                style={styles.itemButton}
              >
                <Text style={styles.itemButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {items.length > 0 && (
          <TouchableOpacity
            onPress={async () => {
              await cancelAllNotifications();
              load();
            }}
            style={{
              marginTop: 20,
              backgroundColor: '#334155',
              paddingVertical: 14,
              borderRadius: 999,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              Cancelar todas las notificaciones
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f172a',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  noText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 10,
  },
  itemContainer: {
    backgroundColor: 'rgba(30,41,59,0.9)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.4)',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  itemBody: {
    color: '#cbd5e1',
    marginTop: 4,
  },
  itemButton: {
    marginTop: 20,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  itemButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
