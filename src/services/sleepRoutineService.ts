import type { RoutineStep } from '../domain/sleepRoutine';
import { supabase } from '../lib/supabaseClient';
import { logSupabaseError, logWriteError } from './supabaseHelpers';

type RoutineRow = {
  user_id: string;
  id: string;
  minutes_before: number;
  icon: string;
  title: string;
  description: string;
  color: string;
  enabled: boolean;
  is_default: boolean;
};

function rowToStep(row: RoutineRow): RoutineStep {
  return {
    id: row.id,
    minutesBefore: row.minutes_before,
    icon: row.icon as RoutineStep['icon'],
    title: row.title,
    description: row.description,
    color: row.color,
    enabled: row.enabled,
    isDefault: row.is_default,
  };
}

function stepToRow(userId: string, step: RoutineStep): RoutineRow {
  return {
    user_id: userId,
    id: step.id,
    minutes_before: step.minutesBefore,
    icon: step.icon,
    title: step.title,
    description: step.description,
    color: step.color,
    enabled: step.enabled,
    is_default: step.isDefault,
  };
}

export async function loadRoutine(
  userId: string,
): Promise<RoutineStep[] | null> {
  const { data, error } = await supabase
    .from('sleep_routine_steps')
    .select(
      'user_id,id,minutes_before,icon,title,description,color,enabled,is_default',
    )
    .eq('user_id', userId);

  if (error) {
    logSupabaseError('load routine', error);
    return null;
  }
  // Sin filas devuelve null (no []) para que la capa superior siembre los pasos por defecto.
  if (!data || data.length === 0) return null;
  return (data as RoutineRow[]).map(rowToStep);
}

export async function upsertRoutineStep(
  userId: string,
  step: RoutineStep,
): Promise<void> {
  const result = await supabase
    .from('sleep_routine_steps')
    .upsert(stepToRow(userId, step), { onConflict: 'user_id,id' });
  logWriteError('save routine step', result);
}

export async function deleteRoutineStep(
  userId: string,
  stepId: string,
): Promise<void> {
  const result = await supabase
    .from('sleep_routine_steps')
    .delete()
    .eq('user_id', userId)
    .eq('id', stepId);
  logWriteError('delete routine step', result);
}

export async function deleteAllRoutineSteps(userId: string): Promise<void> {
  const result = await supabase
    .from('sleep_routine_steps')
    .delete()
    .eq('user_id', userId);
  logWriteError('reset routine', result);
}
