import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepProfile } from '../domain/sleepProfile';
import {
  loadProfile,
  loadProfileFromAuthMetadata,
  saveProfile as saveProfileToTable,
  saveProfileToAuthMetadata,
} from '../services/sleepProfileService';

const STORAGE_KEY_PREFIX = 'sleepProfile/v1';

export const defaultProfile: SleepProfile = {
  age: 30,
  weightKg: 70,
  heightCm: 170,
  gender: 'male',
};

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

export function useSleepProfile(userId: string | null) {
  const [profile, setProfile] = useState<SleepProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const storageKey = makeStorageKey(userId);

      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (isValidSleepProfile(parsed) && !cancelled) {
            setProfile(parsed);
          } else if (!cancelled) {
            setProfile(null);
          }
        } else if (!cancelled) {
          setProfile(null);
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
        const tableProfile = await loadProfile(userId);
        if (tableProfile && !cancelled) {
          setProfile(tableProfile);
          await AsyncStorage.setItem(storageKey, JSON.stringify(tableProfile));
          return;
        }

        const remote = await loadProfileFromAuthMetadata();
        if (isValidSleepProfile(remote) && !cancelled) {
          setProfile(remote);
          await AsyncStorage.setItem(storageKey, JSON.stringify(remote));
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
      await saveProfileToTable(userId, p);
      await saveProfileToAuthMetadata(p);
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
