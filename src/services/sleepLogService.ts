import type { DreamMood, SleepLogEntry } from '../domain/sleepLog';
import { supabase } from '../lib/supabaseClient';
import { logWriteError, mapRowsOrNull } from './supabaseHelpers';

const SLEEP_LOG_COLUMNS =
  'id,user_id,date,bed_time_iso,wake_time_iso,feeling,dreamed,dream_mood,dream_tags,dream_note';

type SleepLogRow = {
  id: string;
  user_id: string;
  date: string;
  bed_time_iso: string;
  wake_time_iso: string;
  feeling: number;
  dreamed: boolean | null;
  dream_mood: number | null;
  dream_tags: string[] | null;
  dream_note: string | null;
};

function rowToEntry(row: SleepLogRow): SleepLogEntry {
  return {
    id: row.id,
    date: row.date,
    bedTimeISO: row.bed_time_iso,
    wakeTimeISO: row.wake_time_iso,
    feeling: row.feeling as 1 | 2 | 3,
    ...(row.dreamed != null ? { dreamed: row.dreamed } : {}),
    ...(row.dream_mood != null
      ? { dreamMood: row.dream_mood as DreamMood }
      : {}),
    ...(row.dream_tags != null ? { dreamTags: row.dream_tags } : {}),
    ...(row.dream_note != null ? { dreamNote: row.dream_note } : {}),
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
    dreamed: entry.dreamed ?? null,
    dream_mood: entry.dreamMood ?? null,
    dream_tags: entry.dreamTags ?? null,
    dream_note: entry.dreamNote ?? null,
  };
}

export async function loadSleepLog(
  userId: string,
): Promise<SleepLogEntry[] | null> {
  const result = await supabase
    .from('sleep_log')
    .select(SLEEP_LOG_COLUMNS)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  return mapRowsOrNull('load sleep log', result, rowToEntry);
}

export async function upsertSleepLogEntry(
  userId: string,
  entry: SleepLogEntry,
): Promise<void> {
  // Garantiza una sola entrada por (user_id, date): borra previas del mismo día con otro id.
  await supabase
    .from('sleep_log')
    .delete()
    .eq('user_id', userId)
    .eq('date', entry.date)
    .neq('id', entry.id);

  const result = await supabase
    .from('sleep_log')
    .upsert(entryToRow(userId, entry), { onConflict: 'id' });
  logWriteError('save sleep log entry', result);
}

export async function deleteSleepLogEntry(
  userId: string,
  id: string,
): Promise<void> {
  const result = await supabase
    .from('sleep_log')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  logWriteError('delete sleep log entry', result);
}
