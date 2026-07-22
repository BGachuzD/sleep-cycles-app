import { describe, expect, it } from '@jest/globals';

import { computeDreamWeekSummary, type DreamEntry } from './dreamEntry';

const dream = (
  id: string,
  date: string,
  mood?: DreamEntry['mood'],
): DreamEntry => ({
  id,
  date,
  mood,
  loggedAt: `${date}T08:00:00.000Z`,
});

describe('computeDreamWeekSummary', () => {
  it('relaciona únicamente los sueños de los últimos siete días', () => {
    const result = computeDreamWeekSummary(
      [
        dream('today', '2026-07-22', 2),
        dream('recent', '2026-07-17', 1),
        dream('old', '2026-07-15', 2),
      ],
      new Date('2026-07-22T12:00:00'),
    );

    expect(result.total).toBe(2);
    expect(result.pleasant).toBe(1);
    expect(result.difficult).toBe(1);
    expect(result.latest?.id).toBe('today');
  });
});
