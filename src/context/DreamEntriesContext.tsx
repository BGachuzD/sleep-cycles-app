// src/context/DreamEntriesContext.tsx
import React, { createContext, type ReactNode, useContext } from 'react';

import type { DreamEntry } from '../domain/dreamEntry';
import { useDreamEntries } from '../hooks/useDreamEntries';
import { useAuth } from './AuthContext';

type DreamEntriesContextValue = {
  dreams: DreamEntry[];
  loading: boolean;
  addDream: (entry: DreamEntry) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const DreamEntriesContext = createContext<DreamEntriesContextValue | undefined>(
  undefined,
);

export const DreamEntriesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { dreams, loading, addDream, deleteDream, refresh } = useDreamEntries(
    user?.id ?? null,
  );

  return (
    <DreamEntriesContext.Provider
      value={{ dreams, loading, addDream, deleteDream, refresh }}
    >
      {children}
    </DreamEntriesContext.Provider>
  );
};

export function useDreamEntriesContext(): DreamEntriesContextValue {
  const ctx = useContext(DreamEntriesContext);
  if (!ctx) {
    throw new Error(
      'useDreamEntriesContext must be used within DreamEntriesProvider',
    );
  }
  return ctx;
}
