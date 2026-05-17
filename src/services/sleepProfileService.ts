import type { SleepProfile } from '../domain/sleepProfile';
import { supabase } from '../lib/supabaseClient';

type SleepProfileRow = {
  user_id: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: 'male' | 'female' | 'other';
  chronotype?: 'morning' | 'intermediate' | 'night' | null;
  wake_hour?: number | null;
  wake_minute?: number | null;
  updated_at?: string;
};

function rowToProfile(row: SleepProfileRow): SleepProfile {
  return {
    age: row.age,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    gender: row.gender,
    chronotype: row.chronotype ?? undefined,
    wakeHour: row.wake_hour ?? undefined,
    wakeMinute: row.wake_minute ?? undefined,
  };
}

function profileToRow(userId: string, profile: SleepProfile): SleepProfileRow {
  return {
    user_id: userId,
    age: profile.age,
    weight_kg: profile.weightKg,
    height_cm: profile.heightCm,
    gender: profile.gender,
    chronotype: profile.chronotype ?? null,
    wake_hour: profile.wakeHour ?? null,
    wake_minute: profile.wakeMinute ?? null,
  };
}

export async function loadProfile(userId: string): Promise<SleepProfile | null> {
  const { data, error } = await supabase
    .from('sleep_profiles')
    .select('user_id,age,weight_kg,height_cm,gender,chronotype,wake_hour,wake_minute,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Error loading sleep profile from sleep_profiles', error);
    return null;
  }
  if (!data) return null;
  return rowToProfile(data as SleepProfileRow);
}

export async function saveProfile(userId: string, profile: SleepProfile): Promise<void> {
  const { error } = await supabase
    .from('sleep_profiles')
    .upsert(profileToRow(userId, profile), { onConflict: 'user_id' });
  if (error) console.warn('Error saving sleep profile in sleep_profiles', error);
}

export async function loadProfileFromAuthMetadata(): Promise<unknown> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('Error loading sleep profile from Supabase auth', error);
    return null;
  }
  return data.user?.user_metadata?.sleep_profile ?? null;
}

export async function saveProfileToAuthMetadata(profile: SleepProfile): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { sleep_profile: profile },
  });
  if (error) console.warn('Error saving sleep profile to Supabase auth metadata', error);
}
