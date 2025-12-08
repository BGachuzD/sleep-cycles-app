export type Gender = 'male' | 'female' | 'other';

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface SleepProfile {
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
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
 * Latencia de sueño aproximada según edad y género.
 * Base 15 min con pequeños ajustes.
 */
export function getLatencyMinutes(age: number, gender: Gender): number {
  let base = 15;

  if (age < 18) base -= 2;
  if (age >= 60) base += 5;

  if (gender === 'female') {
    base += 2;
  }

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
  const latencyMinutes = getLatencyMinutes(profile.age, profile.gender);

  return {
    bmi,
    bmiCategory,
    adjustedCycleMinutes,
    sleepEfficiency,
    latencyMinutes,
  };
}
