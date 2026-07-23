import React, { createContext, type ReactNode, useContext } from 'react';

import type { SleepProfile } from '../domain/sleepProfile';
import { useSleepProfile } from '../hooks/useSleepProfile';
import { useAuth } from './AuthContext';

type SleepProfileContextValue = {
  profile: SleepProfile | null;
  loading: boolean;
  saveProfile: (p: SleepProfile) => Promise<void> | void;
};

const SleepProfileContext = createContext<SleepProfileContextValue | undefined>(
  undefined,
);

type Props = {
  children: ReactNode;
};

export const SleepProfileProvider: React.FC<Props> = ({ children }) => {
  const { user } = useAuth();
  const { profile, loading, saveProfile } = useSleepProfile(user?.id ?? null);

  return (
    <SleepProfileContext.Provider value={{ profile, loading, saveProfile }}>
      {children}
    </SleepProfileContext.Provider>
  );
};

export function useSleepProfileContext(): SleepProfileContextValue {
  const ctx = useContext(SleepProfileContext);
  if (!ctx) {
    throw new Error(
      'useSleepProfileContext must be used within SleepProfileProvider',
    );
  }
  return ctx;
}
