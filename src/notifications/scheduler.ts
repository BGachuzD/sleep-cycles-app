// src/notifications/scheduler.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { logger } from '@/lib/logger';

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
    logger.warn('Error loading notification map', error);
    return {};
  }
}

async function setScheduledMap(map: ScheduledMap): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_KEYS_STORAGE, JSON.stringify(map));
  } catch (error) {
    logger.warn('Error saving notification map', error);
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
 * `timeSensitive` (iOS): atraviesa los modos Focus (p. ej. "Sueño") — esencial
 * para que la alarma de despertar realmente suene. Requiere el entitlement
 * com.apple.developer.usernotifications.time-sensitive.
 */
export async function scheduleLocalNotificationAtDate(params: {
  title: string;
  body: string;
  date: Date;
  timeSensitive?: boolean;
}): Promise<string | null> {
  const { title, body, date, timeSensitive } = params;

  try {
    const trigger: Notifications.DateTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        ...(Platform.OS === 'ios' && timeSensitive
          ? { interruptionLevel: 'timeSensitive' as const }
          : {}),
        ...(Platform.OS === 'android' ? { channelId: 'sleep-reminders' } : {}),
      },
      trigger,
    });

    return id;
  } catch (err) {
    logger.warn('Error scheduling notification', err);
    return null;
  }
}

export async function scheduleUniqueNotificationAtDate(params: {
  key: string;
  title: string;
  body: string;
  date: Date;
  timeSensitive?: boolean;
}): Promise<string | null> {
  const { key, title, body, date, timeSensitive } = params;
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
    timeSensitive,
  });
  if (!id) return null;

  scheduledMap[key] = id;
  await setScheduledMap(scheduledMap);
  return id;
}

/**
 * Alarma inteligente: programa 3 notificaciones escalonadas dentro de la ventana de despertar.
 * - Start: inicio de la ventana (sueño más ligero posible)
 * - Center: punto medio de la ventana (la hora ideal)
 * - End: final de la ventana (backup)
 */
export async function scheduleSmartWakeAlarm(params: {
  keyBase: string;
  windowStart: Date;
  windowEnd: Date;
}): Promise<{
  startId: string | null;
  centerId: string | null;
  endId: string | null;
}> {
  const { keyBase, windowStart, windowEnd } = params;
  const centerMs = (windowStart.getTime() + windowEnd.getTime()) / 2;
  const center = new Date(centerMs);

  // Secuencial a propósito: cada llamada lee y reescribe el mapa persistido
  // de notificaciones; en paralelo los writes se pisan entre sí y se pierden
  // ids (las alarmas viejas quedan huérfanas sin poder cancelarse).
  const startId = await scheduleUniqueNotificationAtDate({
    key: `${keyBase}:start`,
    title: 'Ventana de despertar',
    body: 'Inicio de tu ventana de sueño ligero 😴',
    date: windowStart,
    timeSensitive: true,
  });
  const centerId = await scheduleUniqueNotificationAtDate({
    key: `${keyBase}:center`,
    title: '¡Es hora de despertar!',
    body: 'Hora ideal según tus ciclos de sueño ⏰',
    date: center,
    timeSensitive: true,
  });
  const endId = await scheduleUniqueNotificationAtDate({
    key: `${keyBase}:end`,
    title: 'Último aviso de despertar',
    body: 'Fin de tu ventana óptima. ¡Buen día! ☀️',
    date: windowEnd,
    timeSensitive: true,
  });

  return { startId, centerId, endId };
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
    logger.warn('Error cancelling notification', err);
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
    logger.warn('Error cancelling all notifications', err);
  }
}

const DAILY_LOG_REMINDER_KEY = 'daily-log-reminder';

/**
 * Recordatorio diario para registrar el sueño, programado ~30 min después
 * de la hora de despertar del perfil. Reemplaza el anterior si la hora cambió.
 */
export async function scheduleDailyLogReminder(params: {
  hour: number;
  minute: number;
}): Promise<string | null> {
  const { hour, minute } = params;

  try {
    const scheduledMap = await getScheduledMap();
    const previousId = scheduledMap[DAILY_LOG_REMINDER_KEY];
    if (previousId) {
      await cancelNotification(previousId);
    }

    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Buen día ☀️ ¿Cómo dormiste?',
        body: 'Cuéntame tu noche en un minuto y tu seguimiento sigue al día. Tu racha te espera.',
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'sleep-reminders' } : {}),
      },
      trigger,
    });

    const map = await getScheduledMap();
    map[DAILY_LOG_REMINDER_KEY] = id;
    await setScheduledMap(map);
    return id;
  } catch (err) {
    logger.warn('Error scheduling daily log reminder', err);
    return null;
  }
}

const WEEKLY_RECAP_KEY = 'weekly-recap-reminder';

/**
 * Recordatorio semanal para revisar el resumen de la semana. Trigger semanal
 * (por defecto domingo por la noche). Reemplaza el anterior si ya existía.
 * Cuenta como 1 sola notificación programada (importa por el límite de 64 en iOS).
 *
 * `weekday`: 1 = domingo … 7 = sábado (convención de expo-notifications).
 */
export async function scheduleWeeklyRecapReminder(params: {
  weekday: number;
  hour: number;
  minute: number;
}): Promise<string | null> {
  const { weekday, hour, minute } = params;

  try {
    const scheduledMap = await getScheduledMap();
    const previousId = scheduledMap[WEEKLY_RECAP_KEY];
    if (previousId) {
      await cancelNotification(previousId);
    }

    const trigger: Notifications.WeeklyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tu semana de sueño 🌙',
        body: 'Mira cómo dormiste esta semana y qué ajustar para la próxima.',
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'sleep-reminders' } : {}),
      },
      trigger,
    });

    const map = await getScheduledMap();
    map[WEEKLY_RECAP_KEY] = id;
    await setScheduledMap(map);
    return id;
  } catch (err) {
    logger.warn('Error scheduling weekly recap reminder', err);
    return null;
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
    logger.warn('Error listing notifications', err);
    return [];
  }
}
