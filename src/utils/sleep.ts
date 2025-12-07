import { SleepTimeOption, WakeTimeOptions } from "../types/WakeTimeOptions";

const CYCLE_MINUTES = 90;
const SLEEP_LATENCY_MINUTES = 15;


// Funcion para sumarle los minutos de sueño a una fecha dada
const addMinutes = (date: Date, minutes:  number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

// Funcion para calcular las mejores horas para despertar si te duermes ya
export const getWakeTimesFromNow = (currentDate: Date, cyclesList: number[] = [3, 4, 5, 6]): WakeTimeOptions[] => {
  return cyclesList.map((cycles) => {
    const totalMinutes = cycles * CYCLE_MINUTES + SLEEP_LATENCY_MINUTES;
    const wakeDate = addMinutes(currentDate, totalMinutes);
    return {
      cycles,
      wakeDate,
      totalMinutes,
    };
  });
};

// Funcion para calcular las mejores horas para dormir si quieres despertar a una hora dada
export function getSleepTimesForWakeDate(
  wakeDate: Date,
  cyclesList: number[] = [3, 4, 5, 6]
): SleepTimeOption[] {
  return cyclesList.map((cycles) => {
    const totalMinutes = cycles * CYCLE_MINUTES;
    // restamos latencia + duración de ciclos
    const sleepDate = subtractMinutes(
      wakeDate,
      totalMinutes + SLEEP_LATENCY_MINUTES
    );

    return {
      cycles,
      sleepDate,
      totalMinutes,
    };
  });
}

// Funcion para formatear la hora en formato legible
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Funcion para formatear la duracion del sueño en horas y minutos
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
};



