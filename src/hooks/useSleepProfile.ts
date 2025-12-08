import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepProfile } from '../domain/sleepProfile';

const STORAGE_KEY = 'sleepProfile/v1';

const defaultProfile: SleepProfile = {
  age: 30,
  weightKg: 70,
  heightCm: 170,
  gender: 'male',
};

export function useSleepProfile() {
  const [profile, setProfile] = useState<SleepProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setProfile(parsed);
        } else {
          setProfile(defaultProfile);
        }
      } catch (err) {
        console.warn('Error loading sleep profile', err);
        setProfile(defaultProfile);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = useCallback(async (p: SleepProfile) => {
    setProfile(p);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (err) {
      console.warn('Error saving sleep profile', err);
    }
  }, []);

  return {
    profile,
    loading,
    saveProfile,
  };
}
