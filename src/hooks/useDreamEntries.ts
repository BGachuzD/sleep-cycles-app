// src/hooks/useDreamEntries.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { logger } from '@/lib/logger';

import type { DreamEntry } from '../domain/dreamEntry';
import {
  deleteDreamEntry,
  loadDreamEntries,
  upsertDreamEntry,
} from '../services/dreamEntryService';

const KEY_PREFIX = 'dreamEntries/v1';

function makeKey(userId: string | null): string {
  return `${KEY_PREFIX}:${userId ?? 'guest'}`;
}

function sortByLoggedDesc(list: DreamEntry[]): DreamEntry[] {
  return [...list].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export function useDreamEntries(userId: string | null) {
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const key = makeKey(userId);

      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setDreams(parsed);
        }
      } catch (err) {
        logger.warn('Error loading dream entries from cache', err);
      }

      if (userId) {
        try {
          const remote = await loadDreamEntries(userId);
          if (remote && !cancelled) {
            setDreams(remote);
            await AsyncStorage.setItem(key, JSON.stringify(remote));
          }
        } catch (err) {
          logger.warn('Error syncing dream entries from Supabase', err);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (updated: DreamEntry[]) => {
      try {
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(updated));
      } catch (err) {
        logger.warn('Error persisting dream entries to cache', err);
      }
    },
    [userId],
  );

  const addDream = useCallback(
    async (entry: DreamEntry) => {
      const updated = sortByLoggedDesc([entry, ...dreams]);
      setDreams(updated);
      persist(updated);
      if (userId) await upsertDreamEntry(userId, entry);
    },
    [dreams, persist, userId],
  );

  const deleteDream = useCallback(
    async (id: string) => {
      const updated = dreams.filter((d) => d.id !== id);
      setDreams(updated);
      persist(updated);
      if (userId) await deleteDreamEntry(userId, id);
    },
    [dreams, persist, userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const remote = await loadDreamEntries(userId);
      if (remote) {
        setDreams(remote);
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(remote));
      }
    } catch (err) {
      logger.warn('Error refreshing dream entries', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { dreams, loading, addDream, deleteDream, refresh };
}
