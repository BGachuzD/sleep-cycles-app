export type Gender = 'male' | 'female' | 'other';

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export type Chronotype = 'morning' | 'intermediate' | 'night';

export interface SleepProfile {
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
  chronotype?: Chronotype;
  wakeHour?: number;
  wakeMinute?: number;
}

export interface OptimalSleepWindow {
  bedtimeStart: string; // "HH:MM"
  bedtimeEnd: string;
  wakeStart: string;
  wakeEnd: string;
  label: string;
}

export function getOptimalSleepWindow(chronotype?: Chronotype): OptimalSleepWindow {
  switch (chronotype) {
    case 'morning':
      return {
        bedtimeStart: '21:00',
        bedtimeEnd: '22:30',
        wakeStart: '05:30',
        wakeEnd: '07:00',
        label: 'Matutino',
      };
    case 'night':
      return {
        bedtimeStart: '23:30',
        bedtimeEnd: '01:30',
        wakeStart: '07:30',
        wakeEnd: '09:30',
        label: 'Nocturno',
      };
    default:
      return {
        bedtimeStart: '22:00',
        bedtimeEnd: '23:30',
        wakeStart: '06:30',
        wakeEnd: '08:00',
        label: 'Intermedio',
      };
  }
}

/**
 * Returns true if the given time is within the optimal window for the chronotype.
 */
export function isTimeOptimalForChronotype(
  date: Date,
  type: 'sleep' | 'wake',
  chronotype?: Chronotype,
): boolean {
  const window = getOptimalSleepWindow(chronotype);
  const h = date.getHours();
  const m = date.getMinutes();
  const minutes = h * 60 + m;

  const startStr = type === 'sleep' ? window.bedtimeStart : window.wakeStart;
  const endStr = type === 'sleep' ? window.bedtimeEnd : window.wakeEnd;

  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);

  const start = sh * 60 + sm;
  let end = eh * 60 + em;

  // Handle crossing midnight (e.g., 23:30 → 01:30)
  if (end < start) end += 24 * 60;

  let normalizedMinutes = minutes;
  if (normalizedMinutes < start && end > 24 * 60) {
    normalizedMinutes += 24 * 60;
  }

  return normalizedMinutes >= start && normalizedMinutes <= end;
}

export interface SleepProfileDerived {
  bmi: number;
  bmiCategory: BMICategory;
  adjustedCycleMinutes: number;
  sleepEfficiency: number;
  latencyMinutes: number;
}

/**
 * BMI = peso / (altura_m^2)
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  if (!h) return 0;
  return weightKg / (h * h);
}

export function categorizeBMI(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/**
 * Longitud de ciclo ajustada por edad (minutos).
 * Puedes afinar los tramos luego.
 */
export function getAdjustedCycleLengthMinutes(age: number): number {
  if (age < 1) return 50;
  if (age <= 18) return 95;
  if (age <= 60) return 90;
  return 85;
}

/**
 * Latencia de sueño aproximada según edad, género y cronotipo.
 * Base 15 min con pequeños ajustes.
 */
export function getLatencyMinutes(
  age: number,
  gender: Gender,
  chronotype?: Chronotype,
): number {
  let base = 15;

  if (age < 18) base -= 2;
  if (age >= 60) base += 5;

  if (gender === 'female') base += 2;

  // Los nocturnos tardan más en dormirse a horas tempranas;
  // los matutinos se quedan dormidos más rápido antes de medianoche.
  if (chronotype === 'morning') base -= 3;
  if (chronotype === 'night') base += 3;

  return Math.max(5, base);
}

/**
 * Eficiencia base según edad.
 */
export function getBaseSleepEfficiency(age: number): number {
  if (age < 18) return 0.9;
  if (age <= 40) return 0.88;
  if (age <= 60) return 0.86;
  return 0.82;
}

/**
 * Ajuste de eficiencia por BMI.
 */
export function adjustEfficiencyForBMI(base: number, bmi: number): number {
  if (bmi < 25) return base;
  if (bmi < 30) return base - 0.03;
  return base - 0.06;
}

/**
 * Construye el perfil derivado a partir de los datos básicos.
 */
export function buildDerivedProfile(
  profile: SleepProfile,
): SleepProfileDerived {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const bmiCategory = categorizeBMI(bmi);
  const adjustedCycleMinutes = getAdjustedCycleLengthMinutes(profile.age);

  const baseEff = getBaseSleepEfficiency(profile.age);
  const sleepEfficiency = adjustEfficiencyForBMI(baseEff, bmi);
  const latencyMinutes = getLatencyMinutes(profile.age, profile.gender, profile.chronotype);

  return {
    bmi,
    bmiCategory,
    adjustedCycleMinutes,
    sleepEfficiency,
    latencyMinutes,
  };
}
