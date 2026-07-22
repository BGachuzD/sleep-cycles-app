// src/domain/achievements.ts
//
// Logros derivados on-the-fly del historial (Fase 5, Sprint 3). No se persisten
// en MVP: se recalculan de `entries` + `stats`, así que no requieren migración.
// Igual que sleepInsights, es dominio puro (icon = string) y testeable en Node.

import type { SleepLogEntry, SleepLogStats } from './sleepLog';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Nombre de icono Ionicons (string plano). */
  icon: string;
  unlocked: boolean;
  /** Progreso hacia el logro (solo cuando aún no está desbloqueado). */
  progress?: { current: number; total: number };
}

function milestone(
  id: string,
  title: string,
  description: string,
  icon: string,
  current: number,
  target: number,
): Achievement {
  const unlocked = current >= target;
  return {
    id,
    title,
    description,
    icon,
    unlocked,
    progress: unlocked
      ? undefined
      : { current: Math.min(current, target), total: target },
  };
}

/**
 * Lista de logros con su estado. Orden: desbloqueados primero, y dentro de cada
 * grupo el orden de definición (de más fácil a más difícil).
 */
export function computeAchievements(
  entries: SleepLogEntry[],
  stats: SleepLogStats,
  dreamCount = 0,
): Achievement[] {
  const total = entries.length;
  // Cuenta la bitácora independiente (dreamCount) más los sueños que aún
  // pudieran venir anotados en un registro de noche (legacy).
  const dreamNights = entries.filter((e) => e.dreamed).length + dreamCount;

  const list: Achievement[] = [
    milestone('first-night', 'Primera noche', 'Registra tu primera noche', 'moon', total, 1),
    milestone('week-logged', 'Una semana', 'Registra 7 noches', 'calendar', total, 7),
    milestone('streak-7', 'Racha de 7', '7 noches seguidas en tu objetivo', 'flame', stats.longestStreak, 7),
    milestone('nights-30', 'Constante', 'Registra 30 noches', 'ribbon', total, 30),
    milestone('first-dream', 'Primer sueño', 'Anota tu primer sueño', 'cloudy-night', dreamNights, 1),
    milestone('dream-week', 'Soñador', 'Anota 7 sueños en tu bitácora', 'sparkles', dreamNights, 7),
  ];

  // Desbloqueados primero, preservando el orden de definición dentro de cada grupo.
  return [
    ...list.filter((a) => a.unlocked),
    ...list.filter((a) => !a.unlocked),
  ];
}
