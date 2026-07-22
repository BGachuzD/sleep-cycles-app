import { describe, expect, it } from '@jest/globals';

import { computeBestWakeByDeadline } from './sleepEngine';
import type { SleepProfile } from './sleepProfile';

const profile: SleepProfile = {
  age: 30,
  weightKg: 70,
  heightCm: 175,
  gender: 'male',
};

// A las 2:00 a.m., ciclo de 90 min, eficiencia ~0.88, latencia 15 min:
//   1 ciclo → despertar ~3:57 a.m.
//   2 ciclos → despertar ~5:40 a.m.
//   3 ciclos → despertar ~7:22 a.m.
const NOW_2AM = new Date(2026, 5, 15, 2, 0);

describe('computeBestWakeByDeadline', () => {
  it('con límite 6 a.m. recomienda 2 ciclos (lo mejor que cabe)', () => {
    const deadline = new Date(2026, 5, 15, 6, 0);
    const plan = computeBestWakeByDeadline(profile, NOW_2AM, deadline);
    expect(plan.recommended).not.toBeNull();
    expect(plan.recommended?.cycles).toBe(2);
    expect(plan.recommended!.wakeDate.getTime()).toBeLessThanOrEqual(
      deadline.getTime(),
    );
    expect(plan.minutesAvailable).toBe(240);
  });

  it('si ni un ciclo cabe, recommended es null', () => {
    const deadline = new Date(2026, 5, 15, 2, 30); // 30 min
    const plan = computeBestWakeByDeadline(profile, NOW_2AM, deadline);
    expect(plan.recommended).toBeNull();
    expect(plan.options).toHaveLength(0);
  });

  it('con mucho tiempo recomienda el máximo de ciclos de la lista', () => {
    const deadline = new Date(2026, 5, 15, 14, 0); // 12 h
    const plan = computeBestWakeByDeadline(profile, NOW_2AM, deadline);
    expect(plan.recommended?.cycles).toBe(6);
  });

  it('las opciones vienen ordenadas de más a menos ciclos', () => {
    const deadline = new Date(2026, 5, 15, 6, 0);
    const plan = computeBestWakeByDeadline(profile, NOW_2AM, deadline);
    const cycles = plan.options.map((o) => o.cycles);
    expect(cycles).toEqual([...cycles].sort((a, b) => b - a));
  });
});
