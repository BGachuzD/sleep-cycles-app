// Helpers de presentación puros del flujo "Despertar a las…".

export function minutesUntil(target: Date, now: Date): number {
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 60_000));
}

export function scoreToStars(score: number): number {
  if (score >= 20) return 5;
  if (score >= 12) return 4;
  if (score >= 5) return 3;
  if (score >= 0) return 2;
  return 1;
}
