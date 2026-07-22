// src/domain/dreamEntry.ts
//
// Bitácora de sueños independiente (Fase 5). Un sueño no está atado a una noche
// de sueño: se puede anotar en cualquier momento. Reutiliza las etiquetas y
// límites del tier gratuito definidos para la bitácora en sleepLog.ts.

import type { DreamMood } from './sleepLog';

export interface DreamEntry {
  id: string;
  /** ISO — momento en que se anotó (para trazabilidad y orden). */
  loggedAt: string;
  /** YYYY-MM-DD — fecha local de referencia del sueño. */
  date: string;
  /** 1 = malo, 2 = bueno. */
  mood?: DreamMood;
  tags?: string[];
  note?: string;
}
