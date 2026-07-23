import { describe, expect, it } from '@jest/globals';

import type { SleepLogEntry } from './sleepLog';
import { computeWeeklyRecap } from './weeklyRecap';

const NOW = new Date(2026, 5, 15, 12, 0); // 15 jun 2026, mediodía
const CYCLE = 90; // objetivo = 5 ciclos = 450 min

let counter = 0;
function makeEntry(opts: {
  wakeYear?: number;
  wakeMonth?: number;
  wakeDay: number;
  durationMin: number;
}): SleepLogEntry {
  const { wakeYear = 2026, wakeMonth = 5, wakeDay, durationMin } = opts;
  const wake = new Date(wakeYear, wakeMonth, wakeDay, 7, 0);
  const bed = new Date(wake.getTime() - durationMin * 60 * 1000);
  return {
    id: `e${counter++}`,
    date: `2026-06-${String(wakeDay).padStart(2, '0')}`,
    bedTimeISO: bed.toISOString(),
    wakeTimeISO: wake.toISOString(),
    feeling: 2,
  };
}

describe('computeWeeklyRecap', () => {
  it('resume la semana actual y la compara con la anterior', () => {
    const entries = [
      makeEntry({ wakeDay: 14, durationMin: 480 }), // esta semana, 8 h
      makeEntry({ wakeDay: 12, durationMin: 420 }), // esta semana, 7 h
      makeEntry({ wakeDay: 8, durationMin: 360 }), // semana previa, 6 h
      makeEntry({ wakeDay: 5, durationMin: 360 }), // semana previa, 6 h
    ];
    const recap = computeWeeklyRecap(entries, CYCLE, NOW);
    expect(recap.nights).toBe(2);
    expect(recap.avgMinutes).toBe(450);
    expect(recap.completedNights).toBe(1); // solo la de 480 ≥ 450
    expect(recap.bestNight).toEqual({ date: '2026-06-14', minutes: 480 });
    expect(recap.hasPrevWeek).toBe(true);
    expect(recap.deltaMinutesVsPrev).toBe(90); // 450 − 360
  });

  it('sin semana previa, delta es 0 y hasPrevWeek false', () => {
    const entries = [makeEntry({ wakeDay: 14, durationMin: 480 })];
    const recap = computeWeeklyRecap(entries, CYCLE, NOW);
    expect(recap.nights).toBe(1);
    expect(recap.hasPrevWeek).toBe(false);
    expect(recap.deltaMinutesVsPrev).toBe(0);
  });

  it('sin datos devuelve un resumen vacío', () => {
    const recap = computeWeeklyRecap([], CYCLE, NOW);
    expect(recap.nights).toBe(0);
    expect(recap.avgMinutes).toBe(0);
    expect(recap.bestNight).toBeNull();
  });
});
