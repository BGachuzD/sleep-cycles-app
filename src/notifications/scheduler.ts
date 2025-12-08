import * as Notifications from 'expo-notifications';

/**
 * Programa una notificación local en una fecha.
 */
export async function scheduleLocalNotificationAtDate(params: {
  title: string;
  body: string;
  date: Date;
}): Promise<string | null> {
  const { title, body, date } = params;

  try {
    // Los tipos de expo-notifications están un poco desalineados con la recomendación del runtime, así que aquí aislamos el `any`.
    const trigger = {
      type: 'date',
      date,
    } as any;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger,
    });

    return id;
  } catch (err) {
    console.warn('Error scheduling notification', err);
    return null;
  }
}

// Cancelar una
export async function cancelNotification(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (err) {
    console.warn('Error cancelling notification', err);
  }
}

// Cancelar todas
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('Error cancelling all notifications', err);
  }
}

// Obtener listado
export async function listScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('Error listing notifications', err);
    return [];
  }
}
