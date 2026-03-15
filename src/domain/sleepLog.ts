// src/domain/sleepLog.ts

export interface SleepLogEntry {
  id: string;
  date: string;        // YYYY-MM-DD (fecha en que DESPERTASTE)
  bedTimeISO: string;  // ISO string — hora de acostarte
  wakeTimeISO: string; // ISO string — hora de despertar
  feeling: 1 | 2 | 3; // 1=mal 2=bien 3=excelente
}

export interface SleepLogStats {
  avgSleepMinutes: number;
  avgCycles: number;
  totalDays: number;
  longestStreak: number;
  currentStreak: number;
  debtMinutes: number; // deuda vs objetivo de 5 ciclos/noche en los últimos 7 días
  weekEntries: SleepLogEntry[];
}

export function computeSleepMinutes(entry: SleepLogEntry): number {
  const bed = new Date(entry.bedTimeISO);
  const wake = new Date(entry.wakeTimeISO);
  const diff = wake.getTime() - bed.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60)));
}

export function computeCompleteCycles(
  sleepMinutes: number,
  cycleLengthMinutes: number,
): number {
  return Math.floor(sleepMinutes / cycleLengthMinutes);
}

export function todayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function computeStats(
  entries: SleepLogEntry[],
  cycleLengthMinutes: number = 90,
): SleepLogStats {
  if (entries.length === 0) {
    return {
      avgSleepMinutes: 0,
      avgCycles: 0,
      totalDays: 0,
      longestStreak: 0,
      currentStreak: 0,
      debtMinutes: 0,
      weekEntries: [],
    };
  }

  // Últimos 7 días
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekEntries = entries.filter(
    (e) => new Date(e.wakeTimeISO) >= weekAgo,
  );

  const allMinutes = entries.map(computeSleepMinutes);
  const totalMinutes = allMinutes.reduce((a, b) => a + b, 0);
  const avgSleepMinutes = Math.round(totalMinutes / entries.length);
  const avgCycles = Math.floor(avgSleepMinutes / cycleLengthMinutes);

  // Deuda de sueño: objetivo 5 ciclos por noche (7.5 h con ciclo de 90 min)
  const targetPerNight = 5 * cycleLengthMinutes;
  const weekMinutes = weekEntries.map(computeSleepMinutes).reduce((a, b) => a + b, 0);
  const weekTarget = weekEntries.length * targetPerNight;
  const debtMinutes = Math.max(0, weekTarget - weekMinutes);

  // Rachas: noches consecutivas con al menos 4 ciclos completos
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const goodThreshold = 4 * cycleLengthMinutes;

  let longestStreak = 0;
  let tempStreak = 0;
  for (const entry of sorted) {
    const mins = computeSleepMinutes(entry);
    if (mins >= goodThreshold) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Racha actual: contar hacia atrás desde la última entrada
  let currentStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const mins = computeSleepMinutes(sorted[i]);
    if (mins >= goodThreshold) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    avgSleepMinutes,
    avgCycles,
    totalDays: entries.length,
    longestStreak,
    currentStreak,
    debtMinutes,
    weekEntries,
  };
}
