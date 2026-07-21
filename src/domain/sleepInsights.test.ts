import { describe, expect, it } from '@jest/globals';

import {
  computeInsights,
  MIN_NIGHTS_FOR_ANALYSIS,
  type Insight,
} from './sleepInsights';
import type { DreamMood, SleepLogEntry } from './sleepLog';
import type { SleepProfile } from './sleepProfile';

const profile: SleepProfile = {
  age: 30,
  weightKg: 70,
  heightCm: 175,
  gender: 'male',
};

let counter = 0;

/**
 * Construye una entrada con horas controladas. Las horas se leen en local, así
 * que los tests son estables sin importar la zona horaria de la máquina.
 */
function makeEntry(opts: {
  day: number;
  bedHour: number;
  bedMin?: number;
  wakeHour: number;
  wakeMin?: number;
  feeling?: 1 | 2 | 3;
  dreamed?: boolean;
  dreamMood?: DreamMood;
}): SleepLogEntry {
  const {
    day,
    bedHour,
    bedMin = 0,
    wakeHour,
    wakeMin = 0,
    feeling = 2,
    dreamed,
    dreamMood,
  } = opts;
  // Cama antes de medianoche → noche anterior; de madrugada → mismo día.
  const bedDay = bedHour < 12 ? day : day - 1;
  const bed = new Date(2026, 0, bedDay, bedHour, bedMin);
  const wake = new Date(2026, 0, day, wakeHour, wakeMin);
  const entry: SleepLogEntry = {
    id: `e${counter++}`,
    date: `2026-01-${String(day).padStart(2, '0')}`,
    bedTimeISO: bed.toISOString(),
    wakeTimeISO: wake.toISOString(),
    feeling,
  };
  if (dreamed != null) entry.dreamed = dreamed;
  if (dreamMood != null) entry.dreamMood = dreamMood;
  return entry;
}

function ids(insights: Insight[]): string[] {
  return insights.map((i) => i.id);
}

describe('computeInsights — gating por volumen', () => {
  it('con 0 noches devuelve progreso guiado + consejo', () => {
    const result = computeInsights([], profile);
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('onboarding');
    expect(result[0].cta?.screen).toBe('SleepLog');
    expect(result.some((i) => i.category === 'tip')).toBe(true);
  });

  it('por debajo del umbral sigue en modo progreso', () => {
    const entries = [10, 9, 8].map((day) =>
      makeEntry({ day, bedHour: 23, wakeHour: 7 }),
    );
    const result = computeInsights(entries, profile);
    expect(result[0].category).toBe('onboarding');
    expect(result[0].title).toContain(
      `${entries.length} de ${MIN_NIGHTS_FOR_ANALYSIS}`,
    );
  });
});

describe('computeInsights — regularidad del despertar', () => {
  it('detecta un horario constante (positivo)', () => {
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeEntry({ day: 10 - i, bedHour: 23, wakeHour: 7 }),
    );
    expect(ids(computeInsights(entries, profile))).toContain(
      'wake-regularity-good',
    );
  });

  it('detecta un horario irregular (advertencia)', () => {
    const entries = [5, 6, 7, 8, 9, 10].map((h, i) =>
      makeEntry({ day: 20 - i, bedHour: 23, wakeHour: h }),
    );
    expect(ids(computeInsights(entries, profile))).toContain('wake-regularity');
  });
});

describe('computeInsights — correlaciones', () => {
  it('correlaciona mejores mañanas con acostarse temprano', () => {
    const entries = [
      makeEntry({ day: 10, bedHour: 22, wakeHour: 7, feeling: 3 }),
      makeEntry({ day: 9, bedHour: 22, wakeHour: 7, feeling: 3 }),
      makeEntry({ day: 8, bedHour: 22, wakeHour: 7, feeling: 3 }),
      makeEntry({ day: 7, bedHour: 1, wakeHour: 7, feeling: 1 }),
      makeEntry({ day: 6, bedHour: 1, wakeHour: 7, feeling: 1 }),
      makeEntry({ day: 5, bedHour: 1, wakeHour: 7, feeling: 1 }),
    ];
    expect(ids(computeInsights(entries, profile))).toContain('bedtime-feeling');
  });

  it('marca la correlación de sueños como premium', () => {
    const entries = [
      makeEntry({ day: 10, bedHour: 23, wakeHour: 7, feeling: 3, dreamed: true, dreamMood: 2 }),
      makeEntry({ day: 9, bedHour: 23, wakeHour: 7, feeling: 3, dreamed: true, dreamMood: 2 }),
      makeEntry({ day: 8, bedHour: 23, wakeHour: 7, feeling: 1, dreamed: true, dreamMood: 1 }),
      makeEntry({ day: 7, bedHour: 23, wakeHour: 7, feeling: 1, dreamed: true, dreamMood: 1 }),
      makeEntry({ day: 6, bedHour: 23, wakeHour: 7, feeling: 2, dreamed: false }),
    ];
    const dream = computeInsights(entries, profile).find(
      (i) => i.id === 'dream-mood-correlation',
    );
    expect(dream).toBeDefined();
    expect(dream?.premium).toBe(true);
  });
});

describe('computeInsights — consejo', () => {
  it('siempre incluye un consejo del día', () => {
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeEntry({ day: 10 - i, bedHour: 23, wakeHour: 7 }),
    );
    expect(
      computeInsights(entries, profile).some((i) => i.category === 'tip'),
    ).toBe(true);
  });
});
