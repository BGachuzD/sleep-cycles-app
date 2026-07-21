import { describe, expect, it } from '@jest/globals';

import {
  computeGoalProgress,
  formatGoalTarget,
  type SleepGoal,
} from './sleepGoal';
import type { SleepLogEntry } from './sleepLog';

const NOW = new Date(2026, 5, 15, 12, 0); // 15 jun 2026, mediodía
const goal: SleepGoal = {
  id: 'g1',
  type: 'duration',
  targetMinutes: 450, // 7.5 h
  createdAt: '2026-06-01T00:00:00.000Z',
};

let counter = 0;
function makeEntry(day: number, durationMin: number): SleepLogEntry {
  const wake = new Date(2026, 5, day, 7, 0);
  const bed = new Date(wake.getTime() - durationMin * 60 * 1000);
  return {
    id: `e${counter++}`,
    date: `2026-06-${String(day).padStart(2, '0')}`,
    bedTimeISO: bed.toISOString(),
    wakeTimeISO: wake.toISOString(),
    feeling: 2,
  };
}

describe('formatGoalTarget', () => {
  it('formatea horas enteras y medias', () => {
    expect(formatGoalTarget(480)).toBe('8 h');
    expect(formatGoalTarget(450)).toBe('7.5 h');
  });
});

describe('computeGoalProgress', () => {
  it('calcula adherencia de la semana y estado de hoy', () => {
    const entries = [
      makeEntry(15, 480), // hoy, cumple
      makeEntry(14, 400), // no cumple
      makeEntry(13, 500), // cumple
      makeEntry(5, 600), // fuera de la ventana de 7 días
    ];
    const progress = computeGoalProgress(goal, entries, NOW);
    expect(progress.totalNights).toBe(3);
    expect(progress.metNights).toBe(2);
    expect(progress.adherencePct).toBe(67);
    expect(progress.metToday).toBe(true);
  });

  it('metToday es null si no hay registro de hoy', () => {
    const progress = computeGoalProgress(goal, [makeEntry(14, 480)], NOW);
    expect(progress.metToday).toBeNull();
  });

  it('sin noches en la ventana, adherencia 0', () => {
    const progress = computeGoalProgress(goal, [makeEntry(5, 600)], NOW);
    expect(progress.totalNights).toBe(0);
    expect(progress.adherencePct).toBe(0);
  });
});
