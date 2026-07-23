// src/context/OnboardingContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { logger } from '@/lib/logger';

import { useAuth } from './AuthContext';

type OnboardingContextValue = {
  hasSeen: boolean | null; // null = cargando mientras resolvemos según el user
  markAsSeen: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

const ONBOARDING_KEY_PREFIX = 'onboardingSeen/v1';

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [hasSeen, setHasSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveOnboardingState = async () => {
      if (!user) {
        setHasSeen(false);
        return;
      }

      setHasSeen(null);
      const key = `${ONBOARDING_KEY_PREFIX}:${user.id}`;

      try {
        const stored = await AsyncStorage.getItem(key);
        if (!cancelled) {
          setHasSeen(stored === '1');
        }
      } catch (error) {
        logger.warn('Error loading onboarding flag', error);
        if (!cancelled) {
          setHasSeen(false);
        }
      }
    };

    resolveOnboardingState();

    return () => {
      cancelled = true;
    };
    // Debe re-ejecutarse solo al cambiar el id del usuario, no cada vez que el
    // objeto `user` se recrea (p. ej. al refrescar el token de sesión).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markAsSeen = useCallback(async () => {
    if (!user) return;
    const key = `${ONBOARDING_KEY_PREFIX}:${user.id}`;
    setHasSeen(true);
    try {
      await AsyncStorage.setItem(key, '1');
    } catch (error) {
      logger.warn('Error saving onboarding flag', error);
    }
  }, [user]);

  const resetOnboarding = useCallback(async () => {
    if (!user) {
      setHasSeen(false);
      return;
    }
    const key = `${ONBOARDING_KEY_PREFIX}:${user.id}`;
    setHasSeen(false);
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.warn('Error resetting onboarding flag', error);
    }
  }, [user]);

  return (
    <OnboardingContext.Provider
      value={{ hasSeen, markAsSeen, resetOnboarding }}
    >
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
