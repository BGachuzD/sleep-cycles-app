import React, { createContext, useContext, type ReactNode } from 'react';
import { useSleepProfile } from '../hooks/useSleepProfile';
import type { SleepProfile } from '../domain/sleepProfile';

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
  const { profile, loading, saveProfile } = useSleepProfile();

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
