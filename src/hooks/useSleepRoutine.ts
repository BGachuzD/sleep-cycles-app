// src/hooks/useSleepRoutine.ts
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import {
  DEFAULT_ROUTINE_STEPS,
  mergeWithDefaults,
  sortSteps,
  type RoutineStep,
} from '../domain/sleepRoutine';

const KEY_PREFIX = 'sleepRoutine/v1';

function makeKey(userId: string | null): string {
  return `${KEY_PREFIX}:${userId ?? 'guest'}`;
}

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

async function loadFromSupabase(userId: string): Promise<RoutineStep[] | null> {
  const { data, error } = await supabase
    .from('sleep_routine_steps')
    .select('user_id,id,minutes_before,icon,title,description,color,enabled,is_default')
    .eq('user_id', userId);

  if (error) {
    console.warn('Error loading routine from Supabase', error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return (data as RoutineRow[]).map(rowToStep);
}

async function upsertStepToSupabase(userId: string, step: RoutineStep): Promise<void> {
  const { error } = await supabase
    .from('sleep_routine_steps')
    .upsert(stepToRow(userId, step), { onConflict: 'user_id,id' });
  if (error) console.warn('Error saving routine step to Supabase', error);
}

async function deleteStepFromSupabase(userId: string, stepId: string): Promise<void> {
  const { error } = await supabase
    .from('sleep_routine_steps')
    .delete()
    .eq('user_id', userId)
    .eq('id', stepId);
  if (error) console.warn('Error deleting routine step from Supabase', error);
}

export function useSleepRoutine(userId: string | null) {
  const [steps, setSteps] = useState<RoutineStep[]>(DEFAULT_ROUTINE_STEPS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const key = makeKey(userId);

      // 1. Caché local primero (UI instantánea)
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setSteps(parsed);
        }
      } catch (err) {
        console.warn('Error loading routine from cache', err);
      }

      // 2. Sincronizar desde Supabase si hay sesión
      if (userId) {
        try {
          const remote = await loadFromSupabase(userId);
          if (remote && !cancelled) {
            const merged = mergeWithDefaults(remote);
            setSteps(merged);
            await AsyncStorage.setItem(key, JSON.stringify(merged));
          }
        } catch (err) {
          console.warn('Error syncing routine from Supabase', err);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const persist = useCallback(async (updated: RoutineStep[]) => {
    try {
      await AsyncStorage.setItem(makeKey(userId), JSON.stringify(updated));
    } catch (err) {
      console.warn('Error persisting routine to cache', err);
    }
  }, [userId]);

  const toggleStep = useCallback(async (id: string) => {
    let changed: RoutineStep | undefined;
    setSteps((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? (changed = { ...s, enabled: !s.enabled }) : s,
      );
      persist(updated);
      return updated;
    });
    if (userId && changed) await upsertStepToSupabase(userId, changed);
  }, [persist, userId]);

  const updateStep = useCallback(async (step: RoutineStep) => {
    setSteps((prev) => {
      const updated = sortSteps(prev.map((s) => s.id === step.id ? step : s));
      persist(updated);
      return updated;
    });
    if (userId) await upsertStepToSupabase(userId, step);
  }, [persist, userId]);

  const addStep = useCallback(async (step: RoutineStep) => {
    setSteps((prev) => {
      const updated = sortSteps([...prev, step]);
      persist(updated);
      return updated;
    });
    if (userId) await upsertStepToSupabase(userId, step);
  }, [persist, userId]);

  const deleteStep = useCallback(async (id: string) => {
    setSteps((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      persist(updated);
      return updated;
    });
    if (userId) await deleteStepFromSupabase(userId, id);
  }, [persist, userId]);

  const resetToDefaults = useCallback(async () => {
    setSteps(DEFAULT_ROUTINE_STEPS);
    await persist(DEFAULT_ROUTINE_STEPS);
    if (userId) {
      const { error } = await supabase
        .from('sleep_routine_steps')
        .delete()
        .eq('user_id', userId);
      if (error) console.warn('Error resetting routine in Supabase', error);
    }
  }, [persist, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const remote = await loadFromSupabase(userId);
      if (remote) {
        const merged = mergeWithDefaults(remote);
        setSteps(merged);
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('Error refreshing routine', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { steps, loading, toggleStep, updateStep, addStep, deleteStep, resetToDefaults, refresh };
}
