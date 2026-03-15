import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepProfile } from '../domain/sleepProfile';
import { supabase } from '../lib/supabaseClient';

const STORAGE_KEY_PREFIX = 'sleepProfile/v1';
const LEGACY_STORAGE_KEY = 'sleepProfile/v1';

const defaultProfile: SleepProfile = {
  age: 30,
  weightKg: 70,
  heightCm: 170,
  gender: 'male',
};

type SleepProfileRow = {
  user_id: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: 'male' | 'female' | 'other';
  updated_at?: string;
};

type ProfilesTableRow = {
  id: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
};

type ErrorLike = {
  code?: string;
  message?: string;
};

const TABLE_NOT_FOUND_CODE = 'PGRST205';

function makeStorageKey(userId: string | null) {
  return `${STORAGE_KEY_PREFIX}:${userId ?? 'guest'}`;
}

function isValidSleepProfile(value: unknown): value is SleepProfile {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.age === 'number' &&
    typeof v.weightKg === 'number' &&
    typeof v.heightCm === 'number' &&
    (v.gender === 'male' || v.gender === 'female' || v.gender === 'other')
  );
}

function rowToProfile(row: SleepProfileRow): SleepProfile {
  return {
    age: row.age,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    gender: row.gender,
  };
}

function profilesRowToProfile(row: ProfilesTableRow): SleepProfile | null {
  if (
    typeof row.age !== 'number' ||
    typeof row.weight_kg !== 'number' ||
    typeof row.height_cm !== 'number'
  ) {
    return null;
  }

  return {
    age: row.age,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    // profiles no tiene gender, lo mantenemos local/auth metadata
    gender: defaultProfile.gender,
  };
}

function profileToRow(userId: string, profile: SleepProfile): SleepProfileRow {
  return {
    user_id: userId,
    age: profile.age,
    weight_kg: profile.weightKg,
    height_cm: profile.heightCm,
    gender: profile.gender,
  };
}

function isTableNotFoundError(error: unknown): error is ErrorLike {
  if (!error || typeof error !== 'object') return false;
  const code = (error as ErrorLike).code;
  return code === TABLE_NOT_FOUND_CODE;
}

async function loadFromProfilesTable(userId: string): Promise<SleepProfile | null> {
  const { data, error } = await supabase
    .from('sleep_profiles')
    .select('user_id,age,weight_kg,height_cm,gender,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (!isTableNotFoundError(error)) {
      console.warn('Error loading sleep profile from sleep_profiles', error);
    }
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id,age,weight_kg,height_cm')
      .eq('id', userId)
      .maybeSingle();

    if (profilesError) {
      console.warn('Error loading sleep profile from profiles', profilesError);
      return null;
    }

    if (!profilesData) return null;
    return profilesRowToProfile(profilesData as ProfilesTableRow);
  }
  if (!data) return null;
  return rowToProfile(data as SleepProfileRow);
}

async function saveToProfilesTable(userId: string, profile: SleepProfile): Promise<void> {
  const row = profileToRow(userId, profile);
  const { error } = await supabase.from('sleep_profiles').upsert(row, {
    onConflict: 'user_id',
  });

  if (!error) return;

  if (!isTableNotFoundError(error)) {
    console.warn('Error saving sleep profile in sleep_profiles', error);
    return;
  }

  const { error: profilesError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      age: profile.age,
      weight_kg: profile.weightKg,
      height_cm: profile.heightCm,
    },
    {
      onConflict: 'id',
    },
  );

  if (profilesError) {
    console.warn('Error saving sleep profile in profiles', profilesError);
  }
}

export function useSleepProfile(userId: string | null) {
  const [profile, setProfile] = useState<SleepProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const storageKey = makeStorageKey(userId);

      try {
        let raw = await AsyncStorage.getItem(storageKey);
        if (!raw) {
          // Compat: perfiles guardados antes de usar llave por usuario.
          raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
          if (raw) {
            await AsyncStorage.setItem(storageKey, raw);
          }
        }
        if (raw) {
          const parsed = JSON.parse(raw);
          if (isValidSleepProfile(parsed) && !cancelled) {
            setProfile(parsed);
          } else if (!cancelled) {
            setProfile(null);
          }
        } else {
          if (!cancelled) setProfile(null);
        }
      } catch (err) {
        console.warn('Error loading sleep profile from storage', err);
        if (!cancelled) setProfile(null);
      }

      if (!userId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const tableProfile = await loadFromProfilesTable(userId);
        if (tableProfile && !cancelled) {
          setProfile(tableProfile);
          await AsyncStorage.setItem(storageKey, JSON.stringify(tableProfile));
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Error loading sleep profile from Supabase', error);
        } else {
          const remote = data.user?.user_metadata?.sleep_profile;
          if (isValidSleepProfile(remote) && !cancelled) {
            setProfile(remote);
            await AsyncStorage.setItem(storageKey, JSON.stringify(remote));
          }
        }
      } catch (err) {
        console.warn('Error syncing sleep profile from Supabase', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const saveProfile = useCallback(async (p: SleepProfile) => {
    const storageKey = makeStorageKey(userId);
    setProfile(p);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(p));
    } catch (err) {
      console.warn('Error saving sleep profile in storage', err);
    }

    if (!userId) return;

    try {
      await saveToProfilesTable(userId, p);

      const { error } = await supabase.auth.updateUser({
        data: { sleep_profile: p },
      });
      if (error) {
        console.warn('Error saving sleep profile in Supabase', error);
      }
    } catch (err) {
      console.warn('Error syncing sleep profile to Supabase', err);
    }
  }, [userId]);

  return {
    profile,
    loading,
    saveProfile,
  };
}
