import type * as Notifications from 'expo-notifications';

export type NotificationRequest = Notifications.NotificationRequest;

export function getTriggerDate(
  trigger: NotificationRequest['trigger'],
): Date | null {
  if (!trigger || typeof trigger !== 'object') return null;
  if (!('date' in trigger)) return null;

  const rawDate = (trigger as { date?: string | number | Date }).date;
  if (!rawDate) return null;
  return rawDate instanceof Date ? rawDate : new Date(rawDate);
}

/**
 * Los recordatorios repetitivos (p. ej. el diario "¿Cómo dormiste?") los
 * gestiona la app automáticamente; no tiene sentido listarlos junto a las
 * alarmas puntuales que el usuario programó.
 */
export function isRecurringSystemReminder(
  trigger: NotificationRequest['trigger'],
): boolean {
  if (!trigger || typeof trigger !== 'object') return false;
  return 'repeats' in trigger && trigger.repeats === true;
}

export function formatRelativeDate(date: Date): string {
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
