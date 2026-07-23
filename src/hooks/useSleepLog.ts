// src/hooks/useSleepLog.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { logger } from '@/lib/logger';

import type { SleepLogEntry } from '../domain/sleepLog';
import {
  deleteSleepLogEntry,
  loadSleepLog,
  upsertSleepLogEntry,
} from '../services/sleepLogService';

const KEY_PREFIX = 'sleepLog/v1';

function makeKey(userId: string | null): string {
  return `${KEY_PREFIX}:${userId ?? 'guest'}`;
}

export function useSleepLog(userId: string | null) {
  const [entries, setEntries] = useState<SleepLogEntry[]>([]);
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
          if (Array.isArray(parsed)) setEntries(parsed);
        }
      } catch (err) {
        logger.warn('Error loading sleep log from cache', err);
      }

      // 2. Sincronizar desde Supabase si hay sesión
      if (userId) {
        try {
          const remote = await loadSleepLog(userId);
          if (remote && !cancelled) {
            setEntries(remote);
            await AsyncStorage.setItem(key, JSON.stringify(remote));
          }
        } catch (err) {
          logger.warn('Error syncing sleep log from Supabase', err);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (updated: SleepLogEntry[]) => {
      try {
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(updated));
      } catch (err) {
        logger.warn('Error persisting sleep log to cache', err);
      }
    },
    [userId],
  );

  const addEntry = useCallback(
    async (entry: SleepLogEntry) => {
      setEntries((prev) => {
        const filtered = prev.filter((e) => e.date !== entry.date);
        const updated = [entry, ...filtered].sort((a, b) =>
          b.date.localeCompare(a.date),
        );
        persist(updated);
        return updated;
      });
      if (userId) await upsertSleepLogEntry(userId, entry);
    },
    [persist, userId],
  );

  const updateEntry = useCallback(
    async (entry: SleepLogEntry) => {
      setEntries((prev) => {
        const updated = prev.map((e) => (e.id === entry.id ? entry : e));
        persist(updated);
        return updated;
      });
      if (userId) await upsertSleepLogEntry(userId, entry);
    },
    [persist, userId],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      setEntries((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        persist(updated);
        return updated;
      });
      if (userId) await deleteSleepLogEntry(userId, id);
    },
    [persist, userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const remote = await loadSleepLog(userId);
      if (remote) {
        setEntries(remote);
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(remote));
      }
    } catch (err) {
      logger.warn('Error refreshing sleep log', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { entries, loading, addEntry, updateEntry, deleteEntry, refresh };
}
