// src/context/SleepLogContext.tsx
import React, { createContext, useContext, type ReactNode } from 'react';
import { useSleepLog } from '../hooks/useSleepLog';
import { useAuth } from './AuthContext';
import type { SleepLogEntry } from '../domain/sleepLog';

type SleepLogContextValue = {
  entries: SleepLogEntry[];
  loading: boolean;
  addEntry: (entry: SleepLogEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
};

const SleepLogContext = createContext<SleepLogContextValue | undefined>(
  undefined,
);

export const SleepLogProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { entries, loading, addEntry, deleteEntry } = useSleepLog(
    user?.id ?? null,
  );

  return (
    <SleepLogContext.Provider value={{ entries, loading, addEntry, deleteEntry }}>
      {children}
    </SleepLogContext.Provider>
  );
};

export function useSleepLogContext(): SleepLogContextValue {
  const ctx = useContext(SleepLogContext);
  if (!ctx) {
    throw new Error('useSleepLogContext must be used within SleepLogProvider');
  }
  return ctx;
}
