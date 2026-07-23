// Helpers de fecha/hora del registro de sueño. Puros, sin dependencias de RN.

/** Defaults inteligentes de acostarse/despertar según la hora del día. */
export function getSmartDefaults(): { bed: Date; wake: Date } {
  const now = new Date();
  const hour = now.getHours();

  const wake = new Date();
  const bed = new Date();

  if (hour < 14) {
    const mins = Math.round(now.getMinutes() / 15) * 15;
    wake.setMinutes(mins, 0, 0);
    bed.setTime(wake.getTime() - 8 * 60 * 60 * 1000);
  } else {
    wake.setDate(wake.getDate() + 1);
    wake.setHours(7, 0, 0, 0);
    bed.setHours(23, 0, 0, 0);
  }

  return { bed, wake };
}

/** Copia la hora/minuto de `picked` sobre la fecha de `base`. */
export function withTime(base: Date, picked: Date): Date {
  const next = new Date(base);
  next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
}

/**
 * Ancla la hora de acostarse relativa al despertar: misma fecha del
 * despertar y, si queda igual o después, la noche anterior. Así el
 * cruce de medianoche se resuelve solo y bed < wake siempre.
 */
export function anchorBedToWake(bedHM: Date, wake: Date): Date {
  const bed = withTime(wake, bedHM);
  if (bed.getTime() >= wake.getTime()) {
    bed.setDate(bed.getDate() - 1);
  }
  return bed;
}

export function formatDayCaption(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}
