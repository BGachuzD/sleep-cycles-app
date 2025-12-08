// src/context/OnboardingContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

type OnboardingContextValue = {
  hasSeen: boolean | null; // null = cargando mientras resolvemos según el user
  markAsSeen: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [hasSeen, setHasSeen] = useState<boolean | null>(null);

  useEffect(() => {
    // Cada vez que cambia el usuario, reiniciamos el estado de onboarding
    if (!user) {
      // Sin usuario, realmente no nos interesa el onboarding (RootNavigator ya filtra por !user)
      setHasSeen(false);
      return;
    }

    // Nuevo login / usuario presente => siempre empezamos con hasSeen = false
    setHasSeen(false);
  }, [user?.id]);

  const markAsSeen = useCallback(async () => {
    // Solo cambiamos el estado en memoria
    setHasSeen(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    // Por si quieres forzarlo en algún punto
    setHasSeen(false);
  }, []);

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
