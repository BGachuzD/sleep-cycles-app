// src/context/SleepLogContext.tsx
import React, { createContext, type ReactNode, useContext } from 'react';

import type { SleepLogEntry } from '../domain/sleepLog';
import { useSleepLog } from '../hooks/useSleepLog';
import { useAuth } from './AuthContext';

type SleepLogContextValue = {
  entries: SleepLogEntry[];
  loading: boolean;
  addEntry: (entry: SleepLogEntry) => Promise<void>;
  updateEntry: (entry: SleepLogEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const SleepLogContext = createContext<SleepLogContextValue | undefined>(
  undefined,
);

export const SleepLogProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { entries, loading, addEntry, updateEntry, deleteEntry, refresh } =
    useSleepLog(user?.id ?? null);

  return (
    <SleepLogContext.Provider
      value={{ entries, loading, addEntry, updateEntry, deleteEntry, refresh }}
    >
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
