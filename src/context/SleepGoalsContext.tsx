// src/context/SleepGoalsContext.tsx
import React, { createContext, useContext, type ReactNode } from 'react';
import { useSleepGoals } from '../hooks/useSleepGoals';
import { useAuth } from './AuthContext';
import type { SleepGoal, SleepGoalType } from '../domain/sleepGoal';

type SleepGoalsContextValue = {
  goals: SleepGoal[];
  loading: boolean;
  saveGoal: (type: SleepGoalType, targetMinutes: number) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const SleepGoalsContext = createContext<SleepGoalsContextValue | undefined>(
  undefined,
);

export const SleepGoalsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { goals, loading, saveGoal, removeGoal, refresh } = useSleepGoals(
    user?.id ?? null,
  );

  return (
    <SleepGoalsContext.Provider
      value={{ goals, loading, saveGoal, removeGoal, refresh }}
    >
      {children}
    </SleepGoalsContext.Provider>
  );
};

export function useSleepGoalsContext(): SleepGoalsContextValue {
  const ctx = useContext(SleepGoalsContext);
  if (!ctx) {
    throw new Error(
      'useSleepGoalsContext must be used within SleepGoalsProvider',
    );
  }
  return ctx;
}
