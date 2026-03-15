// src/hooks/useSleepLog.ts
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepLogEntry } from '../domain/sleepLog';

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
      try {
        const raw = await AsyncStorage.getItem(makeKey(userId));
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setEntries(parsed);
        }
      } catch (err) {
        console.warn('Error loading sleep log', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
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
        console.warn('Error saving sleep log', err);
      }
    },
    [userId],
  );

  const addEntry = useCallback(
    async (entry: SleepLogEntry) => {
      setEntries((prev) => {
        // Reemplazar si ya existe una entrada para la misma fecha
        const filtered = prev.filter((e) => e.date !== entry.date);
        const updated = [entry, ...filtered].sort((a, b) =>
          b.date.localeCompare(a.date),
        );
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      setEntries((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  return { entries, loading, addEntry, deleteEntry };
}
