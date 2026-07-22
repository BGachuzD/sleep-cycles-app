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

export interface DreamWeekSummary {
  total: number;
  pleasant: number;
  difficult: number;
  latest: DreamEntry | null;
}

/** Resume los sueños ligados a los últimos siete días locales. */
export function computeDreamWeekSummary(
  dreams: DreamEntry[],
  now: Date = new Date(),
): DreamWeekSummary {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const recent = dreams
    .filter((dream) => {
      const date = new Date(`${dream.date}T12:00:00`);
      return date >= start && date <= end;
    })
    .sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
    );

  return {
    total: recent.length,
    pleasant: recent.filter((dream) => dream.mood === 2).length,
    difficult: recent.filter((dream) => dream.mood === 1).length,
    latest: recent[0] ?? null,
  };
}
