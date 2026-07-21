// src/domain/weeklyRecap.ts
//
// Resumen semanal (Fase 5, Sprint 3). Función pura y testeable: acepta `now`
// como parámetro para que los tests sean deterministas. Compara los últimos
// 7 días contra los 7 anteriores para dar la sensación de progreso.

import { computeSleepMinutes, type SleepLogEntry } from './sleepLog';

export interface WeeklyRecap {
  /** Noches registradas en los últimos 7 días. */
  nights: number;
  avgMinutes: number;
  /** Noches que alcanzaron el objetivo (5 ciclos). */
  completedNights: number;
  bestNight: { date: string; minutes: number } | null;
  /** avg de esta semana menos el de la anterior (minutos). */
  deltaMinutesVsPrev: number;
  hasPrevWeek: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function average(xs: number[]): number {
  if (xs.length === 0) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

export function computeWeeklyRecap(
  entries: SleepLogEntry[],
  cycleMins: number,
  now: Date = new Date(),
): WeeklyRecap {
  const nowMs = now.getTime();
  const weekAgo = nowMs - 7 * DAY_MS;
  const twoWeeksAgo = nowMs - 14 * DAY_MS;

  const wakeMs = (e: SleepLogEntry) => new Date(e.wakeTimeISO).getTime();
  const thisWeek = entries.filter(
    (e) => wakeMs(e) >= weekAgo && wakeMs(e) <= nowMs,
  );
  const prevWeek = entries.filter(
    (e) => wakeMs(e) >= twoWeeksAgo && wakeMs(e) < weekAgo,
  );

  const minutesThis = thisWeek.map(computeSleepMinutes);
  const avgMinutes = average(minutesThis);
  const target = 5 * cycleMins;
  const completedNights = minutesThis.filter((m) => m >= target).length;

  let bestNight: WeeklyRecap['bestNight'] = null;
  for (const e of thisWeek) {
    const m = computeSleepMinutes(e);
    if (!bestNight || m > bestNight.minutes) {
      bestNight = { date: e.date, minutes: m };
    }
  }

  const avgPrev = average(prevWeek.map(computeSleepMinutes));

  return {
    nights: thisWeek.length,
    avgMinutes,
    completedNights,
    bestNight,
    deltaMinutesVsPrev: prevWeek.length > 0 ? avgMinutes - avgPrev : 0,
    hasPrevWeek: prevWeek.length > 0,
  };
}
