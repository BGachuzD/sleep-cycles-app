// src/hooks/useSleepLog.ts
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepLogEntry } from '../domain/sleepLog';
import { supabase } from '../lib/supabaseClient';

const KEY_PREFIX = 'sleepLog/v1';

function makeKey(userId: string | null): string {
  return `${KEY_PREFIX}:${userId ?? 'guest'}`;
}

type SleepLogRow = {
  id: string;
  user_id: string;
  date: string;
  bed_time_iso: string;
  wake_time_iso: string;
  feeling: number;
};

function rowToEntry(row: SleepLogRow): SleepLogEntry {
  return {
    id: row.id,
    date: row.date,
    bedTimeISO: row.bed_time_iso,
    wakeTimeISO: row.wake_time_iso,
    feeling: row.feeling as 1 | 2 | 3,
  };
}

function entryToRow(userId: string, entry: SleepLogEntry): SleepLogRow {
  return {
    id: entry.id,
    user_id: userId,
    date: entry.date,
    bed_time_iso: entry.bedTimeISO,
    wake_time_iso: entry.wakeTimeISO,
    feeling: entry.feeling,
  };
}

async function loadFromSupabase(userId: string): Promise<SleepLogEntry[] | null> {
  const { data, error } = await supabase
    .from('sleep_log')
    .select('id,user_id,date,bed_time_iso,wake_time_iso,feeling')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.warn('Error loading sleep log from Supabase', error);
    return null;
  }
  return (data as SleepLogRow[]).map(rowToEntry);
}

async function upsertEntryToSupabase(userId: string, entry: SleepLogEntry): Promise<void> {
  // Eliminar cualquier entrada previa del mismo día con distinto id
  await supabase
    .from('sleep_log')
    .delete()
    .eq('user_id', userId)
    .eq('date', entry.date)
    .neq('id', entry.id);

  const { error } = await supabase
    .from('sleep_log')
    .upsert(entryToRow(userId, entry), { onConflict: 'id' });
  if (error) console.warn('Error saving sleep log entry to Supabase', error);
}

async function deleteEntryFromSupabase(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('sleep_log')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('Error deleting sleep log entry from Supabase', error);
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
        console.warn('Error loading sleep log from cache', err);
      }

      // 2. Sincronizar desde Supabase si hay sesión
      if (userId) {
        try {
          const remote = await loadFromSupabase(userId);
          if (remote && !cancelled) {
            setEntries(remote);
            await AsyncStorage.setItem(key, JSON.stringify(remote));
          }
        } catch (err) {
          console.warn('Error syncing sleep log from Supabase', err);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const persist = useCallback(async (updated: SleepLogEntry[]) => {
    try {
      await AsyncStorage.setItem(makeKey(userId), JSON.stringify(updated));
    } catch (err) {
      console.warn('Error persisting sleep log to cache', err);
    }
  }, [userId]);

  const addEntry = useCallback(async (entry: SleepLogEntry) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date);
      const updated = [entry, ...filtered].sort((a, b) =>
        b.date.localeCompare(a.date),
      );
      persist(updated);
      return updated;
    });
    if (userId) await upsertEntryToSupabase(userId, entry);
  }, [persist, userId]);

  const updateEntry = useCallback(async (entry: SleepLogEntry) => {
    setEntries((prev) => {
      const updated = prev.map((e) => e.id === entry.id ? entry : e);
      persist(updated);
      return updated;
    });
    if (userId) await upsertEntryToSupabase(userId, entry);
  }, [persist, userId]);

  const deleteEntry = useCallback(async (id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      persist(updated);
      return updated;
    });
    if (userId) await deleteEntryFromSupabase(userId, id);
  }, [persist, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const remote = await loadFromSupabase(userId);
      if (remote) {
        setEntries(remote);
        await AsyncStorage.setItem(makeKey(userId), JSON.stringify(remote));
      }
    } catch (err) {
      console.warn('Error refreshing sleep log', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { entries, loading, addEntry, updateEntry, deleteEntry, refresh };
}
