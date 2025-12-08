import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sleepCycles/onboardingSeen';

type OnboardingContextValue = {
  hasSeen: boolean | null; // null = cargando
  markAsSeen: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [hasSeen, setHasSeen] = useState<boolean | null>(null);

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

  return (
    <OnboardingContext.Provider value={{ hasSeen, markAsSeen }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error(
      'useOnboardingContext must be used within an OnboardingProvider',
    );
  }
  return ctx;
};
