import type { SleepLogEntry } from '../domain/sleepLog';
import { supabase } from '../lib/supabaseClient';

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

export async function loadSleepLog(userId: string): Promise<SleepLogEntry[] | null> {
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

  const { error } = await supabase
    .from('sleep_log')
    .upsert(entryToRow(userId, entry), { onConflict: 'id' });
  if (error) console.warn('Error saving sleep log entry to Supabase', error);
}

export async function deleteSleepLogEntry(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('sleep_log')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('Error deleting sleep log entry from Supabase', error);
}
