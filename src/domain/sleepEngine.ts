import { SleepProfile, buildDerivedProfile } from './sleepProfile';

export type RecommendationMode = 'sleepNow' | 'wakeAt';

export interface SleepRecommendation {
  mode: RecommendationMode;
  cycles: number;
  sleepDate: Date;
  wakeDate: Date;
  totalSleepMinutes: number;
  tibMinutes: number;
  efficiency: number;
  latencyMinutes: number;
  score: number;
  windowStart: Date;
  windowEnd: Date;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

function makeWindow(
  center: Date,
  windowMinutes: number,
): {
  start: Date;
  end: Date;
} {
  const half = windowMinutes;
  return {
    start: subtractMinutes(center, half),
    end: addMinutes(center, half),
  };
}

/**
 * Score simple basado en duración y eficiencia.
 */
function computeScore(totalSleepMinutes: number, efficiency: number): number {
  const hours = totalSleepMinutes / 60;
  let score = 0;

  // Ventana ideal 7–9 horas
  if (hours >= 7 && hours <= 9) {
    score += 20;
  } else if (hours < 6) {
    score -= 10;
  }

  // Ajuste por eficiencia
  score += (efficiency - 0.8) * 50;

  return score;
}

/**
 * Sleep Now:
 * Dado un perfil y la hora actual, calcula horas de despertar recomendadas.
 */
export function computeSleepNowRecommendations(
  profile: SleepProfile,
  now: Date,
  cyclesList: number[] = [3, 4, 5, 6],
): SleepRecommendation[] {
  const derived = buildDerivedProfile(profile);

  return cyclesList.map((cycles) => {
    const totalSleepMinutes = cycles * derived.adjustedCycleMinutes;
    const tibMinutes =
      totalSleepMinutes / derived.sleepEfficiency + derived.latencyMinutes;

    const sleepDate = now;
    const wakeDate = addMinutes(now, tibMinutes);

    const score = computeScore(totalSleepMinutes, derived.sleepEfficiency);
    const window = makeWindow(wakeDate, 15); // ±15 min, luego lo podemos parametrizar

    return {
      mode: 'sleepNow',
      cycles,
      sleepDate,
      wakeDate,
      totalSleepMinutes,
      tibMinutes,
      efficiency: derived.sleepEfficiency,
      latencyMinutes: derived.latencyMinutes,
      score,
      windowStart: window.start,
      windowEnd: window.end,
    };
  });
}

export interface DeadlineWakePlan {
  /**
   * Mejor opción de ciclos completos cuyo despertar cae ANTES o justo en la
   * hora límite. `null` si ni un ciclo completo cabe (queda muy poco tiempo).
   */
  recommended: SleepRecommendation | null;
  /** Minutos entre ahora y la hora límite. */
  minutesAvailable: number;
  /** Opciones que caben dentro de la hora límite, de más a menos ciclos. */
  options: SleepRecommendation[];
}

/**
 * "Necesito despertar a las X y me duermo ahora": calcula la mejor hora de
 * despertar. Devuelve la opción con MÁS ciclos completos cuyo despertar no pase
 * de `deadline` (lo mejor posible aunque queden pocos ciclos). Si ni un ciclo
 * cabe, `recommended` es null y la UI sugiere despertar en la hora límite.
 */
export function computeBestWakeByDeadline(
  profile: SleepProfile,
  now: Date,
  deadline: Date,
  cyclesList: number[] = [1, 2, 3, 4, 5, 6],
): DeadlineWakePlan {
  const all = computeSleepNowRecommendations(profile, now, cyclesList);
  const minutesAvailable = Math.max(
    0,
    Math.round((deadline.getTime() - now.getTime()) / 60_000),
  );

  const options = all
    .filter((o) => o.wakeDate.getTime() <= deadline.getTime())
    .sort((a, b) => b.cycles - a.cycles);

  return {
    recommended: options[0] ?? null,
    minutesAvailable,
    options,
  };
}

/**
 * Wake At:
 * Dado un perfil y hora objetivo de despertar, calcula a qué hora dormir.
 */
export function computeWakeAtRecommendations(
  profile: SleepProfile,
  wakeDate: Date,
  cyclesList: number[] = [3, 4, 5, 6],
): SleepRecommendation[] {
  const derived = buildDerivedProfile(profile);

  return cyclesList.map((cycles) => {
    const totalSleepMinutes = cycles * derived.adjustedCycleMinutes;
    const tibMinutes =
      totalSleepMinutes / derived.sleepEfficiency + derived.latencyMinutes;

    const sleepDate = subtractMinutes(wakeDate, tibMinutes);

    const score = computeScore(totalSleepMinutes, derived.sleepEfficiency);
    const window = makeWindow(sleepDate, 15);

    return {
      mode: 'wakeAt',
      cycles,
      sleepDate,
      wakeDate,
      totalSleepMinutes,
      tibMinutes,
      efficiency: derived.sleepEfficiency,
      latencyMinutes: derived.latencyMinutes,
      score,
      windowStart: window.start,
      windowEnd: window.end,
    };
  });
}
