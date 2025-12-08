import {
  computeSleepNowRecommendations,
  computeWakeAtRecommendations,
} from '../domain/sleepEngine';
import type { SleepRecommendation } from '../domain/sleepEngine';
import type { SleepProfile } from '../domain/sleepProfile';

export type WakeTimeOption = {
  cycles: number;
  wakeDate: Date;
  totalMinutes: number;
  tibMinutes: number;
  efficiency: number;
  isRecommended: boolean;

  windowStart: Date;
  windowEnd: Date;
};

export type SleepTimeOption = {
  cycles: number;
  sleepDate: Date;
  totalMinutes: number;
  tibMinutes: number;
  efficiency: number;
  isRecommended: boolean;

  windowStart: Date;
  windowEnd: Date;
};

/**
 * Sleep Now
 */
export function getWakeTimesFromNowForProfile(
  profile: SleepProfile,
  baseDate: Date,
  cyclesList: number[] = [3, 4, 5, 6],
): WakeTimeOption[] {
  const recs: SleepRecommendation[] = computeSleepNowRecommendations(
    profile,
    baseDate,
    cyclesList,
  );

  const bestScore = Math.max(...recs.map((r) => r.score));

  return recs.map((r) => ({
    cycles: r.cycles,
    wakeDate: r.wakeDate,
    totalMinutes: r.totalSleepMinutes,
    tibMinutes: r.tibMinutes,
    efficiency: r.efficiency,
    isRecommended: r.score === bestScore,
    windowStart: r.windowStart,
    windowEnd: r.windowEnd,
  }));
}

/**
 * Wake At
 */
export function getSleepTimesForWakeDateForProfile(
  profile: SleepProfile,
  wakeDate: Date,
  cyclesList: number[] = [3, 4, 5, 6],
): SleepTimeOption[] {
  const recs: SleepRecommendation[] = computeWakeAtRecommendations(
    profile,
    wakeDate,
    cyclesList,
  );

  const bestScore = Math.max(...recs.map((r) => r.score));

  return recs.map((r) => ({
    cycles: r.cycles,
    sleepDate: r.sleepDate,
    totalMinutes: r.totalSleepMinutes,
    tibMinutes: r.tibMinutes,
    efficiency: r.efficiency,
    isRecommended: r.score === bestScore,
    windowStart: r.windowStart,
    windowEnd: r.windowEnd,
  }));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatTimeRange(start: Date, end: Date): string {
  const startStr = formatTime(start);
  const endStr = formatTime(end);
  return `${startStr} – ${endStr}`;
}
