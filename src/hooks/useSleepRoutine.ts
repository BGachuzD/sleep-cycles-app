// src/hooks/useSleepRoutine.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { logger } from '@/lib/logger';

import {
  DEFAULT_ROUTINE_STEPS,
  mergeWithDefaults,
  type RoutineStep,
  sortSteps,
} from '../domain/sleepRoutine';
import {
  deleteAllRoutineSteps,
  deleteRoutineStep,
  loadRoutine,
  upsertRoutineStep,
} from '../services/sleepRoutineService';

const KEY_PREFIX = 'sleepRoutine/v1';

function makeKey(userId: string | null): string {
  return `${KEY_PREFIX}:${userId ?? 'guest'}`;
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
        logger.warn('Error loading routine from cache', err);
      }

      // 2. Sincronizar desde Supabase si hay sesión
      if (userId) {
        try {
          const remote = await loadRoutine(userId);
          if (remote && !cancelled) {
            const merged = mergeWithDefaults(remote);
            setSteps(merged);
            await AsyncStorage.setItem(key, JSON.stringify(merged));
          }
        } catch (err) {
          logger.warn('Error syncing routine from Supabase', err);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (updated: RoutineStep[]) => {
      try {
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(updated));
      } catch (err) {
        logger.warn('Error persisting routine to cache', err);
      }
    },
    [userId],
  );

  const toggleStep = useCallback(
    async (id: string) => {
      let changed: RoutineStep | undefined;
      setSteps((prev) => {
        const updated = prev.map((s) =>
          s.id === id ? (changed = { ...s, enabled: !s.enabled }) : s,
        );
        persist(updated);
        return updated;
      });
      if (userId && changed) await upsertRoutineStep(userId, changed);
    },
    [persist, userId],
  );

  const updateStep = useCallback(
    async (step: RoutineStep) => {
      setSteps((prev) => {
        const updated = sortSteps(
          prev.map((s) => (s.id === step.id ? step : s)),
        );
        persist(updated);
        return updated;
      });
      if (userId) await upsertRoutineStep(userId, step);
    },
    [persist, userId],
  );

  const addStep = useCallback(
    async (step: RoutineStep) => {
      setSteps((prev) => {
        const updated = sortSteps([...prev, step]);
        persist(updated);
        return updated;
      });
      if (userId) await upsertRoutineStep(userId, step);
    },
    [persist, userId],
  );

  const deleteStep = useCallback(
    async (id: string) => {
      setSteps((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        persist(updated);
        return updated;
      });
      if (userId) await deleteRoutineStep(userId, id);
    },
    [persist, userId],
  );

  const resetToDefaults = useCallback(async () => {
    setSteps(DEFAULT_ROUTINE_STEPS);
    await persist(DEFAULT_ROUTINE_STEPS);
    if (userId) await deleteAllRoutineSteps(userId);
  }, [persist, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const remote = await loadRoutine(userId);
      if (remote) {
        const merged = mergeWithDefaults(remote);
        setSteps(merged);
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(merged));
      }
    } catch (err) {
      logger.warn('Error refreshing routine', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    steps,
    loading,
    toggleStep,
    updateStep,
    addStep,
    deleteStep,
    resetToDefaults,
    refresh,
  };
}
