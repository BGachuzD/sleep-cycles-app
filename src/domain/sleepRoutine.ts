// src/domain/sleepRoutine.ts
import type { Ionicons } from '@expo/vector-icons';

export interface RoutineStep {
  id: string;
  minutesBefore: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  enabled: boolean;
  isDefault: boolean; // true = uno de los 7 pasos base
}

export const DEFAULT_ROUTINE_STEPS: RoutineStep[] = [
  {
    id: 'default-120',
    minutesBefore: 120,
    icon: 'tv-outline',
    title: 'Reduce pantallas',
    description:
      'Baja el brillo de tus dispositivos y activa el modo nocturno.',
    color: '#f97316',
    enabled: true,
    isDefault: true,
  },
  {
    id: 'default-90',
    minutesBefore: 90,
    icon: 'restaurant-outline',
    title: 'Última comida ligera',
    description: 'Evita comidas pesadas. Una infusión caliente puede ayudar.',
    color: '#fbbf24',
    enabled: true,
    isDefault: true,
  },
  {
    id: 'default-60',
    minutesBefore: 60,
    icon: 'notifications-off-outline',
    title: 'Silencia el teléfono',
    description: 'Activa modo No Molestar. Solo emergencias.',
    color: '#a78bfa',
    enabled: true,
    isDefault: true,
  },
  {
    id: 'default-45',
    minutesBefore: 45,
    icon: 'body-outline',
    title: 'Estiramientos suaves',
    description: '5 a 10 minutos de yoga suave o estiramientos relajantes.',
    color: '#34d399',
    enabled: true,
    isDefault: true,
  },
  {
    id: 'default-30',
    minutesBefore: 30,
    icon: 'book-outline',
    title: 'Lectura o meditación',
    description: 'Lee un libro físico o practica respiración profunda.',
    color: '#60a5fa',
    enabled: true,
    isDefault: true,
  },
  {
    id: 'default-15',
    minutesBefore: 15,
    icon: 'thermometer-outline',
    title: 'Temperatura ideal',
    description:
      'La habitación a una temperatura de 18 a 20 °C favorece el sueño profundo.',
    color: '#818cf8',
    enabled: true,
    isDefault: true,
  },
  {
    id: 'default-0',
    minutesBefore: 0,
    icon: 'moon-outline',
    title: '¡Hora de dormir!',
    description: 'Apaga la luz y cierra los ojos. Tu cuerpo está listo.',
    color: '#c4b5fd',
    enabled: true,
    isDefault: true,
  },
];

export function sortSteps(steps: RoutineStep[]): RoutineStep[] {
  return [...steps].sort((a, b) => b.minutesBefore - a.minutesBefore);
}

const DEFAULT_IDS = new Set(DEFAULT_ROUTINE_STEPS.map((s) => s.id));

export function mergeWithDefaults(remote: RoutineStep[]): RoutineStep[] {
  const remoteById = new Map(remote.map((s) => [s.id, s]));
  const merged = DEFAULT_ROUTINE_STEPS.map(
    (def) => remoteById.get(def.id) ?? def,
  );
  const customSteps = remote.filter((s) => !DEFAULT_IDS.has(s.id));
  return sortSteps([...merged, ...customSteps]);
}
