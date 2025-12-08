import { useOnboardingContext } from '../context/OnboardingContext';

export function useOnboardingFlag() {
  return useOnboardingContext();
}
