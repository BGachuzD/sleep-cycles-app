// src/context/SleepRoutineContext.tsx
import React, { createContext, type ReactNode, useContext } from 'react';

import type { RoutineStep } from '../domain/sleepRoutine';
import { useSleepRoutine } from '../hooks/useSleepRoutine';
import { useAuth } from './AuthContext';

type SleepRoutineContextValue = {
  steps: RoutineStep[];
  loading: boolean;
  toggleStep: (id: string) => Promise<void>;
  updateStep: (step: RoutineStep) => Promise<void>;
  addStep: (step: RoutineStep) => Promise<void>;
  deleteStep: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SleepRoutineContext = createContext<SleepRoutineContextValue | undefined>(
  undefined,
);

export const SleepRoutineProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const routine = useSleepRoutine(user?.id ?? null);

  return (
    <SleepRoutineContext.Provider value={routine}>
      {children}
    </SleepRoutineContext.Provider>
  );
};

export function useSleepRoutineContext(): SleepRoutineContextValue {
  const ctx = useContext(SleepRoutineContext);
  if (!ctx)
    throw new Error(
      'useSleepRoutineContext must be used within SleepRoutineProvider',
    );
  return ctx;
}
