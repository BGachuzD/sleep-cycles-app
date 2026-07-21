// src/hooks/useSleepGoals.ts
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import type { SleepGoal, SleepGoalType } from '../domain/sleepGoal';
import {
  loadGoals,
  upsertGoal,
  deleteGoal,
} from '../services/sleepGoalService';

const KEY_PREFIX = 'sleepGoals/v1';

function makeKey(userId: string | null): string {
  return `${KEY_PREFIX}:${userId ?? 'guest'}`;
}

export function useSleepGoals(userId: string | null) {
  const [goals, setGoals] = useState<SleepGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const key = makeKey(userId);

      // 1. Caché local primero
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setGoals(parsed);
        }
      } catch (err) {
        console.warn('Error loading sleep goals from cache', err);
      }

      // 2. Sincronizar desde Supabase
      if (userId) {
        try {
          const remote = await loadGoals(userId);
          if (remote && !cancelled) {
            setGoals(remote);
            await AsyncStorage.setItem(key, JSON.stringify(remote));
          }
        } catch (err) {
          console.warn('Error syncing sleep goals from Supabase', err);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (updated: SleepGoal[]) => {
      try {
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(updated));
      } catch (err) {
        console.warn('Error persisting sleep goals to cache', err);
      }
    },
    [userId],
  );

  // Guarda (o actualiza) la meta de un tipo. Reutiliza el id/createdAt de la
  // meta existente del mismo tipo para no violar el unique (user_id, type).
  const saveGoal = useCallback(
    async (type: SleepGoalType, targetMinutes: number) => {
      const existing = goals.find((g) => g.type === type);
      const goal: SleepGoal = existing
        ? { ...existing, targetMinutes }
        : {
            id: uuidv4(),
            type,
            targetMinutes,
            createdAt: new Date().toISOString(),
          };
      const updated = [goal, ...goals.filter((g) => g.type !== type)];
      setGoals(updated);
      persist(updated);
      if (userId) await upsertGoal(userId, goal);
    },
    [goals, persist, userId],
  );

  const removeGoal = useCallback(
    async (id: string) => {
      const updated = goals.filter((g) => g.id !== id);
      setGoals(updated);
      persist(updated);
      if (userId) await deleteGoal(userId, id);
    },
    [goals, persist, userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const remote = await loadGoals(userId);
      if (remote) {
        setGoals(remote);
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(remote));
      }
    } catch (err) {
      console.warn('Error refreshing sleep goals', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { goals, loading, saveGoal, removeGoal, refresh };
}
