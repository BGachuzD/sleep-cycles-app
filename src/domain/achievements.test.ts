import { describe, expect, it } from '@jest/globals';

import { computeAchievements, type Achievement } from './achievements';
import type { SleepLogEntry, SleepLogStats } from './sleepLog';

const emptyStats: SleepLogStats = {
  avgSleepMinutes: 0,
  avgCycles: 0,
  totalDays: 0,
  longestStreak: 0,
  currentStreak: 0,
  debtMinutes: 0,
  weekEntries: [],
};

let counter = 0;
function makeEntry(dreamed = false): SleepLogEntry {
  const id = `e${counter++}`;
  return {
    id,
    date: `2026-01-${String((counter % 27) + 1).padStart(2, '0')}`,
    bedTimeISO: new Date(2026, 0, 1, 23, 0).toISOString(),
    wakeTimeISO: new Date(2026, 0, 2, 7, 0).toISOString(),
    feeling: 2,
    ...(dreamed ? { dreamed: true } : {}),
  };
}

function byId(list: Achievement[], id: string): Achievement {
  const found = list.find((a) => a.id === id);
  if (!found) throw new Error(`achievement ${id} not found`);
  return found;
}

describe('computeAchievements', () => {
  it('sin noches, "primera noche" está bloqueado con progreso 0/1', () => {
    const result = computeAchievements([], emptyStats);
    const first = byId(result, 'first-night');
    expect(first.unlocked).toBe(false);
    expect(first.progress).toEqual({ current: 0, total: 1 });
  });

  it('con una noche, "primera noche" se desbloquea', () => {
    const result = computeAchievements([makeEntry()], emptyStats);
    expect(byId(result, 'first-night').unlocked).toBe(true);
  });

  it('con 7 noches, "una semana" se desbloquea', () => {
    const entries = Array.from({ length: 7 }, () => makeEntry());
    expect(byId(computeAchievements(entries, emptyStats), 'week-logged').unlocked).toBe(true);
  });

  it('la racha usa longestStreak de stats', () => {
    const stats: SleepLogStats = { ...emptyStats, longestStreak: 7 };
    expect(byId(computeAchievements([makeEntry()], stats), 'streak-7').unlocked).toBe(true);
  });

  it('cuenta las noches con bitácora para los logros de sueño', () => {
    const entries = [makeEntry(true), makeEntry(false)];
    expect(byId(computeAchievements(entries, emptyStats), 'first-dream').unlocked).toBe(true);
    expect(byId(computeAchievements(entries, emptyStats), 'dream-week').progress).toEqual({
      current: 1,
      total: 7,
    });
  });

  it('ordena los desbloqueados primero', () => {
    const entries = Array.from({ length: 7 }, () => makeEntry());
    const result = computeAchievements(entries, emptyStats);
    const firstLockedIndex = result.findIndex((a) => !a.unlocked);
    const lastUnlockedIndex = [...result]
      .map((a) => a.unlocked)
      .lastIndexOf(true);
    expect(lastUnlockedIndex).toBeLessThan(firstLockedIndex);
  });
});
