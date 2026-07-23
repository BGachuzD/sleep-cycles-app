// src/services/healthKitService.ts
//
// Capa de I/O contra Apple HealthKit. Solo lectura. Solo iOS.
//
// Diseño defensivo:
// - Todos los métodos se comportan como "no-op" fuera de iOS o si HealthKit
//   no está disponible. Devuelven null/false/[] en lugar de lanzar.
// - Los errores se loguean con logger.error pero nunca se propagan hacia
//   los hooks/UI. La app debe poder funcionar sin HealthKit.

import HealthKit, {
  AuthorizationStatus,
  authorizationStatusFor,
  isHealthDataAvailable,
  queryCategorySamples,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';

import { logger } from '@/lib/logger';

const SLEEP_ANALYSIS = 'HKCategoryTypeIdentifierSleepAnalysis' as const;

// Valores de HKCategoryValueSleepAnalysis que cuentan como "estuvo dormido".
// Apple Watch escribe valores más granulares (Core/Deep/REM); el iPhone solo
// escribe el genérico "asleep" y "inBed".
const SLEEP_VALUES = new Set<number>([
  1, // asleepUnspecified
  3, // asleepCore
  4, // asleepDeep
  5, // asleepREM
]);

export interface HealthKitSleepEntry {
  /** YYYY-MM-DD — fecha del despertar (no del bedTime). */
  date: string;
  /** ISO string — momento más temprano marcado como "in bed" o "asleep". */
  bedTime: string;
  /** ISO string — momento más tardío del mismo grupo. */
  wakeTime: string;
  /** Identificador de origen para badges/UI. No se persiste en BD. */
  source: 'healthkit';
  /** Duración total entre bedTime y wakeTime en minutos. */
  durationMinutes: number;
}

type CategorySample = {
  startDate: Date | string;
  endDate: Date | string;
  value: number;
};

// ─────────────────────────────────────────────
// Disponibilidad
// ─────────────────────────────────────────────

/**
 * True si HealthKit puede usarse en este dispositivo.
 * Falso en Android, en simulador iOS y en hardware iOS sin HealthKit.
 */
export async function isHealthKitAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return isHealthDataAvailable();
  } catch (err) {
    logger.error('[HealthKit] availability check failed', err);
    return false;
  }
}

// ─────────────────────────────────────────────
// Permisos
// ─────────────────────────────────────────────

/**
 * Solicita autorización de lectura para Sleep Analysis.
 * Apple no devuelve si el usuario aceptó o rechazó (por privacidad);
 * por eso aquí intentamos una query mínima inmediatamente después.
 * Si la query devuelve datos (o un array vacío sin error), asumimos
 * autorizado. Si lanza, asumimos denegado.
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    if (!isHealthDataAvailable()) return false;

    await requestAuthorization({
      toRead: [SLEEP_ANALYSIS],
      toShare: [],
    });

    // Apple oculta el estado real de "read permission" por privacidad.
    // La forma confiable de validar es intentar una query pequeña.
    return await hasHealthKitPermissions();
  } catch (err) {
    logger.error('[HealthKit] requestAuthorization failed', err);
    return false;
  }
}

/**
 * Verifica si ya tiene permisos sin volver a pedirlos.
 * Intenta una query mínima de los últimos 7 días y considera "autorizado"
 * cualquier resultado sin error (incluyendo array vacío). Es la única
 * señal fiable que da HealthKit para reads.
 */
export async function hasHealthKitPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    if (!isHealthDataAvailable()) return false;

    // Si nunca se pidió, status será NotDetermined → mejor no asumir true.
    const status = authorizationStatusFor(SLEEP_ANALYSIS);
    if (status === AuthorizationStatus.notDetermined) {
      return false;
    }

    // Probar una query pequeña. Si el usuario denegó, las queries devuelven
    // array vacío silenciosamente (no lanzan). Sin un dato real no podemos
    // distinguir "denegado" de "autorizado sin data". Por convención, si la
    // query no lanza, asumimos que tenemos al menos la oportunidad de leer.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await queryCategorySamples(SLEEP_ANALYSIS, {
      filter: {
        date: { startDate: sevenDaysAgo, endDate: new Date() },
      },
      ascending: true,
      limit: 1,
    });
    return true;
  } catch (err) {
    logger.error('[HealthKit] hasHealthKitPermissions check failed', err);
    return false;
  }
}

// ─────────────────────────────────────────────
// Queries de sueño
// ─────────────────────────────────────────────

/**
 * Lee samples de sueño dentro de la ventana especificada y devuelve los
 * raw samples sin consolidar. Uso interno.
 */
async function querySleepSamples(
  from: Date,
  to: Date,
): Promise<CategorySample[]> {
  if (Platform.OS !== 'ios') return [];
  try {
    const samples = await queryCategorySamples(SLEEP_ANALYSIS, {
      filter: {
        date: { startDate: from, endDate: to },
      },
      ascending: true,
      limit: 0, // 0 = todos
    });
    return samples as unknown as CategorySample[];
  } catch (err) {
    logger.error('[HealthKit] querySleepSamples failed', err);
    return [];
  }
}

/**
 * Consolida múltiples samples de un mismo "episodio de sueño" en una sola
 * entrada. Apple Watch suele escribir 1 sample por fase (REM/Deep/Core)
 * más un "inBed" envolvente; el iPhone escribe menos. Tomamos:
 *  - bedTime = inicio más temprano de cualquier sample del grupo
 *  - wakeTime = fin más tardío de cualquier sample del grupo
 */
function consolidateSamples(
  samples: CategorySample[],
  wakeDateString: string,
): HealthKitSleepEntry | null {
  // Filtrar solo samples que cuentan como sueño activo o en cama.
  // value 0 = inBed, ≥1 = alguna fase de asleep.
  const relevant = samples.filter(
    (s) => s.value === 0 || SLEEP_VALUES.has(s.value),
  );

  if (relevant.length === 0) return null;

  const starts = relevant.map((s) => new Date(s.startDate).getTime());
  const ends = relevant.map((s) => new Date(s.endDate).getTime());
  const bedMs = Math.min(...starts);
  const wakeMs = Math.max(...ends);

  if (wakeMs <= bedMs) return null;

  const durationMinutes = Math.round((wakeMs - bedMs) / 60_000);

  return {
    date: wakeDateString,
    bedTime: new Date(bedMs).toISOString(),
    wakeTime: new Date(wakeMs).toISOString(),
    source: 'healthkit',
    durationMinutes,
  };
}

/**
 * Construye la ventana de búsqueda para "el sueño que terminó en `date`".
 * `bedTime` puede ser antes de medianoche del día anterior, así que la
 * ventana abarca desde las 18:00 del día anterior hasta las 14:00 de `date`.
 */
function buildSearchWindow(dateString: string): { from: Date; to: Date } {
  // Construir en local time. Si dateString es '2026-05-20', queremos:
  //   from = 2026-05-19 18:00 local
  //   to   = 2026-05-20 14:00 local
  const [y, m, d] = dateString.split('-').map(Number);
  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);

  const from = new Date(dayStart);
  from.setDate(from.getDate() - 1);
  from.setHours(18, 0, 0, 0);

  const to = new Date(dayStart);
  to.setHours(14, 0, 0, 0);

  return { from, to };
}

/**
 * Busca y consolida los datos de sueño correspondientes al "despertar" de
 * la fecha dada (YYYY-MM-DD). Si no hay datos, devuelve null.
 */
export async function fetchSleepDataForDate(
  date: string,
): Promise<HealthKitSleepEntry | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    const { from, to } = buildSearchWindow(date);
    const samples = await querySleepSamples(from, to);
    return consolidateSamples(samples, date);
  } catch (err) {
    logger.error('[HealthKit] fetchSleepDataForDate failed', err);
    return null;
  }
}

/**
 * Busca datos de sueño para un rango de fechas (inclusivo) y devuelve
 * una entrada consolidada por día. Útil para sync histórico.
 */
export async function fetchSleepDataForRange(
  startDate: string,
  endDate: string,
): Promise<HealthKitSleepEntry[]> {
  if (Platform.OS !== 'ios') return [];
  try {
    // Iteramos día a día. Es O(N días) — para 30 días son 30 queries.
    // Alternativa: una sola query del rango completo + agrupar por día,
    // pero el agrupado es ambiguo cuando un dormir cruza medianoche.
    const result: HealthKitSleepEntry[] = [];
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = formatDateKey(d);
      const entry = await fetchSleepDataForDate(dateStr);
      if (entry) result.push(entry);
    }
    return result;
  } catch (err) {
    logger.error('[HealthKit] fetchSleepDataForRange failed', err);
    return [];
  }
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Re-export por si algún consumidor necesita acceso directo al SDK.
export { HealthKit };
