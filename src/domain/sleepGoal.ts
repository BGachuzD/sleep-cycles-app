// src/domain/sleepGoal.ts
//
// Metas de sueño (Fase 5, Sprint 3). MVP: una meta de "duración objetivo" por
// usuario (el tier gratuito permite una; Premium permitirá varias/otros tipos).
// El cálculo de adherencia es dominio puro y testeable.

import {
  computeSleepMinutes,
  localDateString,
  type SleepLogEntry,
} from './sleepLog';

export type SleepGoalType = 'duration';

export interface SleepGoal {
  id: string;
  type: SleepGoalType;
  /** Objetivo en minutos (para type 'duration'). */
  targetMinutes: number;
  createdAt: string; // ISO
}

/** Presets de duración objetivo (minutos): 7, 7.5, 8, 8.5 h. */
export const GOAL_DURATION_PRESETS = [420, 450, 480, 510] as const;

/** "7.5 h" a partir de minutos. */
export function formatGoalTarget(targetMinutes: number): string {
  const h = targetMinutes / 60;
  const label = Number.isInteger(h) ? String(h) : h.toFixed(1);
  return `${label} h`;
}

export interface GoalProgress {
  metNights: number;
  totalNights: number;
  adherencePct: number;
  /** true/false si ya hay registro de hoy; null si aún no registras hoy. */
  metToday: boolean | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeGoalProgress(
  goal: SleepGoal,
  entries: SleepLogEntry[],
  now: Date = new Date(),
): GoalProgress {
  const nowMs = now.getTime();
  const weekAgo = nowMs - 7 * DAY_MS;

  const window = entries.filter((e) => {
    const t = new Date(e.wakeTimeISO).getTime();
    return t >= weekAgo && t <= nowMs;
  });

  const metNights = window.filter(
    (e) => computeSleepMinutes(e) >= goal.targetMinutes,
  ).length;
  const totalNights = window.length;
  const adherencePct =
    totalNights > 0 ? Math.round((metNights / totalNights) * 100) : 0;

  const today = localDateString(now);
  const todayEntry = entries.find((e) => e.date === today);
  const metToday = todayEntry
    ? computeSleepMinutes(todayEntry) >= goal.targetMinutes
    : null;

  return { metNights, totalNights, adherencePct, metToday };
}
