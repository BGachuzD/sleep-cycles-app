import { logger } from '@/lib/logger';

/**
 * Helpers compartidos por la capa de servicios de Supabase. Centralizan el
 * manejo de errores (que antes se repetía en cada operación) sin ocultar las
 * queries: cada servicio sigue construyendo su propia consulta y mapeo de fila.
 *
 * Todos degradan con gracia (registran y devuelven null/void); nunca lanzan,
 * para que un fallo de red no tumbe la UI.
 */

/** Registra un error de Supabase con contexto legible. No lanza. */
export function logSupabaseError(context: string, error: unknown): void {
  logger.warn(`Supabase: ${context}`, error);
}

/**
 * Procesa el resultado de una lectura de lista: si hubo error lo registra y
 * devuelve `null`; si no, mapea cada fila a su tipo de dominio. Una lista vacía
 * devuelve `[]` (usa un chequeo propio si necesitas distinguir vacío de error).
 */
export function mapRowsOrNull<Row, T>(
  context: string,
  result: { data: unknown; error: unknown },
  mapRow: (row: Row) => T,
): T[] | null {
  if (result.error) {
    logSupabaseError(context, result.error);
    return null;
  }
  return (result.data as Row[]).map(mapRow);
}

/** Procesa el resultado de una escritura: solo registra el error si lo hubo. */
export function logWriteError(
  context: string,
  result: { error: unknown },
): void {
  if (result.error) logSupabaseError(context, result.error);
}
