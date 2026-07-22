import type { DreamEntry } from '../domain/dreamEntry';
import type { DreamMood } from '../domain/sleepLog';
import { supabase } from '../lib/supabaseClient';

const DREAM_COLUMNS = 'id,user_id,logged_at,date,mood,tags,note';

type DreamRow = {
  id: string;
  user_id: string;
  logged_at: string;
  date: string;
  mood: number | null;
  tags: string[] | null;
  note: string | null;
};

function rowToEntry(row: DreamRow): DreamEntry {
  return {
    id: row.id,
    loggedAt: row.logged_at,
    date: row.date,
    ...(row.mood != null ? { mood: row.mood as DreamMood } : {}),
    ...(row.tags != null ? { tags: row.tags } : {}),
    ...(row.note != null ? { note: row.note } : {}),
  };
}

export async function loadDreamEntries(
  userId: string,
): Promise<DreamEntry[] | null> {
  const { data, error } = await supabase
    .from('dream_entries')
    .select(DREAM_COLUMNS)
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });

  if (error) {
    console.warn('Error loading dream entries from Supabase', error);
    return null;
  }
  return (data as DreamRow[]).map(rowToEntry);
}

export async function upsertDreamEntry(
  userId: string,
  entry: DreamEntry,
): Promise<void> {
  const { error } = await supabase.from('dream_entries').upsert(
    {
      id: entry.id,
      user_id: userId,
      logged_at: entry.loggedAt,
      date: entry.date,
      mood: entry.mood ?? null,
      tags: entry.tags ?? null,
      note: entry.note ?? null,
    },
    { onConflict: 'id' },
  );
  if (error) console.warn('Error saving dream entry to Supabase', error);
}

export async function deleteDreamEntry(
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('dream_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('Error deleting dream entry from Supabase', error);
}
