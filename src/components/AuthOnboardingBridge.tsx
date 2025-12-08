// src/components/AuthOnboardingBridge.tsx
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOnboardingFlag } from '../hooks/useOnboardingFlag';

export const AuthOnboardingBridge = () => {
  const { user } = useAuth();
  const { resetOnboarding } = useOnboardingFlag();

  useEffect(() => {
    if (!user) {
      resetOnboarding();
    }
  }, [user, resetOnboarding]);

  return null;
};
