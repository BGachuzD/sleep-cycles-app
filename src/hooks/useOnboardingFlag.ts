import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sleepCycles/onboardingSeen';

export function useOnboardingFlag() {
  const [hasSeen, setHasSeen] = useState<boolean | null>(null); // null = cargando

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setHasSeen(raw === '1');
      } catch (err) {
        console.warn('Error reading onboarding flag', err);
        setHasSeen(false);
      }
    })();
  }, []);

  const markAsSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
      setHasSeen(true);
    } catch (err) {
      console.warn('Error saving onboarding flag', err);
    }
  }, []);

  return { hasSeen, markAsSeen };
}
