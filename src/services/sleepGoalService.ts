import type { SleepGoal, SleepGoalType } from '../domain/sleepGoal';
import { supabase } from '../lib/supabaseClient';
import { logWriteError, mapRowsOrNull } from './supabaseHelpers';

const SLEEP_GOAL_COLUMNS = 'id,user_id,type,target_minutes,created_at';

type SleepGoalRow = {
  id: string;
  user_id: string;
  type: string;
  target_minutes: number;
  created_at: string;
};

function rowToGoal(row: SleepGoalRow): SleepGoal {
  return {
    id: row.id,
    type: row.type as SleepGoalType,
    targetMinutes: row.target_minutes,
    createdAt: row.created_at,
  };
}

export async function loadGoals(userId: string): Promise<SleepGoal[] | null> {
  const result = await supabase
    .from('sleep_goals')
    .select(SLEEP_GOAL_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return mapRowsOrNull('load sleep goals', result, rowToGoal);
}

export async function upsertGoal(
  userId: string,
  goal: SleepGoal,
): Promise<void> {
  const result = await supabase.from('sleep_goals').upsert(
    {
      id: goal.id,
      user_id: userId,
      type: goal.type,
      target_minutes: goal.targetMinutes,
      created_at: goal.createdAt,
    },
    { onConflict: 'id' },
  );
  logWriteError('save sleep goal', result);
}

export async function deleteGoal(userId: string, id: string): Promise<void> {
  const result = await supabase
    .from('sleep_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  logWriteError('delete sleep goal', result);
}
