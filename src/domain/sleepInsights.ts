// src/domain/sleepInsights.ts
//
// Motor de insights heurístico (Fase 5, Sprint 2).
//
// Función pura: recibe el historial + el perfil y devuelve una lista de
// mensajes personalizados ("acompañamiento"). No importa nada de React Native
// ni de navegación a propósito: `icon` es el nombre de un Ionicon como string
// y `cta.screen` es el nombre de la pantalla como string. Eso mantiene el
// dominio libre de dependencias y testeable en Node. La UI castea esos strings.

import {
  computeStats,
  type SleepLogEntry,
} from './sleepLog';
import {
  getAdjustedCycleLengthMinutes,
  type SleepProfile,
} from './sleepProfile';

export type InsightCategory =
  | 'onboarding' // progreso hacia el primer análisis
  | 'debt'
  | 'regularity'
  | 'correlation'
  | 'streak'
  | 'tip';

export type InsightSeverity = 'positive' | 'neutral' | 'warning';

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  /** Nombre de icono Ionicons (string plano — el dominio no conoce RN). */
  icon: string;
  title: string;
  body: string;
  /** Progreso hacia un objetivo (p. ej. noches para el primer análisis). */
  progress?: { current: number; total: number };
  /** CTA opcional: `screen` es el nombre de pantalla del drawer. */
  cta?: { label: string; screen: string };
  /** Si el insight requiere Mimebien Premium para verse completo. */
  premium?: boolean;
}

/**
 * Noches mínimas para empezar a generar correlaciones/regularidad. Por debajo
 * de este umbral solo mostramos progreso guiado + consejo del día: el gating
 * evita que el motor "adivine" con pocos datos.
 */
export const MIN_NIGHTS_FOR_ANALYSIS = 5;

/** Biblioteca de consejos rotativos (contenido curado, no personalizado). */
export const SLEEP_TIPS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Cuida la cafeína',
    body: 'Evita el café después de las 3 p.m. La cafeína puede tardar 6 horas en reducirse a la mitad en tu cuerpo.',
  },
  {
    title: 'Baja las pantallas',
    body: 'Apaga las pantallas 30–60 min antes de dormir: la luz azul retrasa la melatonina.',
  },
  {
    title: 'Revisa tu almohada',
    body: 'Una almohada dura 1–2 años. Si despiertas con el cuello tenso, quizá sea hora de cambiarla.',
  },
  {
    title: 'Ancla tu despertar',
    body: 'Despertar a la misma hora todos los días, incluso el fin de semana, estabiliza tu reloj interno.',
  },
  {
    title: 'Temperatura ideal',
    body: 'La mayoría duerme mejor en una habitación fresca, entre 16 y 19 °C.',
  },
  {
    title: 'Luz de mañana',
    body: 'Exponerte a luz natural al despertar ayuda a fijar tu ritmo circadiano y a dormir mejor esa noche.',
  },
];

// ─────────────────────────────────────────────
// Helpers puros
// ─────────────────────────────────────────────

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Minuto del día (0–1439) de la hora de despertar, en hora local. */
function wakeMinuteOfDay(entry: SleepLogEntry): number {
  const d = new Date(entry.wakeTimeISO);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * "Minuto nocturno" de la hora de acostarse: las horas después de medianoche
 * (h < 12) se desplazan +24h para poder comparar 23:30 con 00:30 en una recta.
 */
function bedNightMinute(entry: SleepLogEntry): number {
  const d = new Date(entry.bedTimeISO);
  let m = d.getHours() * 60 + d.getMinutes();
  if (d.getHours() < 12) m += 24 * 60;
  return m;
}

/** Formatea un minuto (0–1439, admite desborde del "minuto nocturno") a 12h. */
function formatClock(minute: number): string {
  const m = ((Math.round(minute) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const period = h24 >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

function rotatingTip(seed: number): Insight {
  const tip = SLEEP_TIPS[Math.abs(seed) % SLEEP_TIPS.length];
  return {
    id: 'tip',
    category: 'tip',
    severity: 'neutral',
    icon: 'bulb-outline',
    title: tip.title,
    body: tip.body,
  };
}

/** Dispersión de la hora de despertar en las últimas noches. */
function wakeRegularity(
  entries: SleepLogEntry[],
): { spreadMinutes: number } | null {
  const recent = entries.slice(0, 7);
  if (recent.length < 3) return null;
  const mins = recent.map(wakeMinuteOfDay);
  const spreadMinutes = (Math.max(...mins) - Math.min(...mins)) / 2;
  return { spreadMinutes };
}

/** Correlación: ¿las mejores mañanas coinciden con acostarse más temprano? */
function bedtimeFeelingCorrelation(entries: SleepLogEntry[]): Insight | null {
  const good = entries.filter((e) => e.feeling === 3);
  const notGood = entries.filter((e) => e.feeling <= 2);
  if (good.length < 2 || notGood.length < 2) return null;

  const avgGood = avg(good.map(bedNightMinute));
  const avgOther = avg(notGood.map(bedNightMinute));
  // Positivo → en las malas noches te acuestas más tarde que en las buenas.
  if (avgOther - avgGood >= 30) {
    return {
      id: 'bedtime-feeling',
      category: 'correlation',
      severity: 'neutral',
      icon: 'moon-outline',
      title: 'Duermes mejor cuando te acuestas temprano',
      body: `Tus mejores mañanas coinciden con acostarte cerca de las ${formatClock(
        avgGood,
      )}. Cuando te duermes más tarde, sueles despertar peor.`,
    };
  }
  return null;
}

/** Correlación con la bitácora de sueños (Premium). */
function dreamMoodCorrelation(entries: SleepLogEntry[]): Insight | null {
  const withDreams = entries.filter(
    (e) => e.dreamed && e.dreamMood != null,
  );
  const bad = withDreams.filter((e) => e.dreamMood === 1);
  const good = withDreams.filter((e) => e.dreamMood === 2);
  if (bad.length < 2 || good.length < 2) return null;

  if (avg(good.map((e) => e.feeling)) - avg(bad.map((e) => e.feeling)) >= 0.5) {
    return {
      id: 'dream-mood-correlation',
      category: 'correlation',
      severity: 'neutral',
      icon: 'cloudy-night-outline',
      title: 'Tus sueños reflejan tu descanso',
      body: 'Las noches con sueños negativos coinciden con despertares menos reparadores. Seguir anotando tus sueños te ayuda a ver el patrón.',
      premium: true,
    };
  }
  return null;
}

// ─────────────────────────────────────────────
// Motor
// ─────────────────────────────────────────────

/**
 * Produce la lista de insights para el usuario. Orden: lo más accionable
 * primero (progreso/deuda/regularidad), luego refuerzos positivos, y siempre
 * un consejo del día al final.
 */
export function computeInsights(
  entries: SleepLogEntry[],
  profile: SleepProfile,
): Insight[] {
  const insights: Insight[] = [];

  // 1. Gating por volumen: con pocos datos, guía en vez de adivinar.
  if (entries.length < MIN_NIGHTS_FOR_ANALYSIS) {
    const remaining = MIN_NIGHTS_FOR_ANALYSIS - entries.length;
    insights.push({
      id: 'onboarding-progress',
      category: 'onboarding',
      severity: 'neutral',
      icon: 'analytics-outline',
      title:
        entries.length === 0
          ? 'Empieza tu seguimiento'
          : `Vas ${entries.length} de ${MIN_NIGHTS_FOR_ANALYSIS} noches`,
      body: `Registra ${remaining} ${
        remaining === 1 ? 'noche más' : 'noches más'
      } para desbloquear tu primer análisis personalizado.`,
      progress: { current: entries.length, total: MIN_NIGHTS_FOR_ANALYSIS },
      cta: { label: 'Registrar noche', screen: 'SleepLog' },
    });
    insights.push(rotatingTip(entries.length));
    return insights;
  }

  const cycleMins = getAdjustedCycleLengthMinutes(profile.age);
  const stats = computeStats(entries, cycleMins);

  // 2. Deuda de sueño.
  if (stats.debtMinutes >= 60) {
    const debtH = (stats.debtMinutes / 60).toFixed(1);
    insights.push({
      id: 'sleep-debt',
      category: 'debt',
      severity: 'warning',
      icon: 'alert-circle-outline',
      title: 'Llevas deuda de sueño',
      body: `Esta semana acumulas ${debtH} h por debajo de tu objetivo de 5 ciclos por noche. Intenta adelantar tu hora de dormir 20–30 min.`,
      cta: { label: 'Ver estadísticas', screen: 'Stats' },
    });
  }

  // 3. Regularidad del horario de despertar.
  const reg = wakeRegularity(entries);
  if (reg && reg.spreadMinutes >= 90) {
    insights.push({
      id: 'wake-regularity',
      category: 'regularity',
      severity: 'warning',
      icon: 'time-outline',
      title: 'Tu hora de despertar varía mucho',
      body: `Tu hora de despertar oscila cerca de ±${Math.round(
        reg.spreadMinutes,
      )} min. Fijar una hora estable, incluso el fin de semana, mejora la calidad del descanso.`,
    });
  } else if (reg && reg.spreadMinutes <= 30) {
    insights.push({
      id: 'wake-regularity-good',
      category: 'regularity',
      severity: 'positive',
      icon: 'checkmark-circle-outline',
      title: 'Horario muy constante',
      body: 'Tu hora de despertar es muy regular. Eso ayuda a tu reloj interno a mantener ciclos de sueño saludables.',
    });
  }

  // 4. Correlación sensación ↔ hora de acostarse.
  const bedtimeCorr = bedtimeFeelingCorrelation(entries);
  if (bedtimeCorr) insights.push(bedtimeCorr);

  // 5. Refuerzo de racha.
  if (stats.currentStreak >= 3) {
    insights.push({
      id: 'streak',
      category: 'streak',
      severity: 'positive',
      icon: 'flame-outline',
      title: `Racha de ${stats.currentStreak} noches`,
      body: `Llevas ${stats.currentStreak} noches seguidas cumpliendo tu objetivo. ¡No la rompas!`,
    });
  }

  // 6. Correlación con la bitácora de sueños (Premium).
  const dreamCorr = dreamMoodCorrelation(entries);
  if (dreamCorr) insights.push(dreamCorr);

  // 7. Consejo del día (siempre, al final).
  insights.push(rotatingTip(entries.length));

  return insights;
}
