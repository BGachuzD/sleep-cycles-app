// src/notifications/scheduler.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_KEYS_STORAGE = 'scheduledNotifications/v1';

type ScheduledMap = Record<string, string>;

async function getScheduledMap(): Promise<ScheduledMap> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_KEYS_STORAGE);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as ScheduledMap;
  } catch (error) {
    console.warn('Error loading notification map', error);
    return {};
  }
}

async function setScheduledMap(map: ScheduledMap): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_KEYS_STORAGE, JSON.stringify(map));
  } catch (error) {
    console.warn('Error saving notification map', error);
  }
}

function normalizeToFutureDate(date: Date): Date {
  const now = Date.now();
  if (date.getTime() > now) return date;

  const normalized = new Date(date);
  while (normalized.getTime() <= now) {
    normalized.setDate(normalized.getDate() + 1);
  }
  return normalized;
}

/**
 * Programa una notificación local en una fecha específica.
 */
export async function scheduleLocalNotificationAtDate(params: {
  title: string;
  body: string;
  date: Date;
}): Promise<string | null> {
  const { title, body, date } = params;

  try {
    const trigger: Notifications.DateTriggerInput = {
      type: 'date',
      date,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'sleep-reminders' } : {}),
      },
      trigger,
    });

    return id;
  } catch (err) {
    console.warn('Error scheduling notification', err);
    return null;
  }
}

export async function scheduleUniqueNotificationAtDate(params: {
  key: string;
  title: string;
  body: string;
  date: Date;
}): Promise<string | null> {
  const { key, title, body, date } = params;
  const targetDate = normalizeToFutureDate(date);

  const scheduledMap = await getScheduledMap();
  const previousId = scheduledMap[key];

  if (previousId) {
    await cancelNotification(previousId);
  }

  const id = await scheduleLocalNotificationAtDate({
    title,
    body,
    date: targetDate,
  });
  if (!id) return null;

  scheduledMap[key] = id;
  await setScheduledMap(scheduledMap);
  return id;
}

/**
 * Cancelar una notificación programada por id.
 */
export async function cancelNotification(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);

    const scheduledMap = await getScheduledMap();
    const updatedEntries = Object.entries(scheduledMap).filter(
      ([, value]) => value !== id,
    );
    await setScheduledMap(Object.fromEntries(updatedEntries));
  } catch (err) {
    console.warn('Error cancelling notification', err);
  }
}

/**
 * Cancelar todas las notificaciones programadas.
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIFICATION_KEYS_STORAGE);
  } catch (err) {
    console.warn('Error cancelling all notifications', err);
  }
}

/**
 * Listar todas las notificaciones programadas actualmente.
 */
export async function listScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('Error listing notifications', err);
    return [];
  }
}
