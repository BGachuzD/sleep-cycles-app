import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  configurePurchases,
  getIsPremium,
  isPurchasesConfigured,
} from '../lib/purchases';

/**
 * Abstracción de "entitlements" (Fase 5).
 *
 * Fuente única de verdad sobre si el usuario tiene Mimebien Premium. Toda
 * función premium consulta `usePremium()`, nunca el SDK de pagos directamente.
 * El estado real llega de `src/lib/purchases.ts`; mientras esa capa esté en modo
 * stub (sin API key de RevenueCat), `isPremium` cae al override de desarrollo.
 *
 * `presentPaywall` abre el `PaywallHost` (modal) montado en `App.tsx`.
 */

/**
 * Override de desarrollo: `true` para previsualizar las funciones Premium sin
 * tener RevenueCat activo. ⚠️ En producción siempre `false` — cuando RevenueCat
 * está configurado, este valor se ignora y manda el entitlement real.
 */
const DEV_PREMIUM_OVERRIDE = false;

type EntitlementsContextValue = {
  isPremium: boolean;
  isLoading: boolean;
  /** Abre el paywall. `context` explica qué función lo disparó. */
  presentPaywall: (context?: string) => void;
  // ── Usado por PaywallHost ──
  paywallVisible: boolean;
  paywallContext?: string;
  dismissPaywall: () => void;
  /** Relee el entitlement tras una compra/restauración. */
  refreshEntitlement: () => Promise<void>;
};

const EntitlementsContext = createContext<EntitlementsContextValue | undefined>(
  undefined,
);

export const EntitlementsProvider = ({ children }: { children: ReactNode }) => {
  const configured = isPurchasesConfigured();
  const [isPremium, setIsPremium] = useState(
    configured ? false : DEV_PREMIUM_OVERRIDE,
  );
  const [isLoading, setIsLoading] = useState(configured);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallContext, setPaywallContext] = useState<string | undefined>();

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      try {
        await configurePurchases();
        const premium = await getIsPremium();
        if (!cancelled) setIsPremium(premium);
      } catch (err) {
        console.warn('[purchases] init failed', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const presentPaywall = useCallback((context?: string) => {
    setPaywallContext(context);
    setPaywallVisible(true);
  }, []);

  const dismissPaywall = useCallback(() => setPaywallVisible(false), []);

  const refreshEntitlement = useCallback(async () => {
    if (!isPurchasesConfigured()) return;
    try {
      setIsPremium(await getIsPremium());
    } catch (err) {
      console.warn('[purchases] refresh failed', err);
    }
  }, []);

  const value: EntitlementsContextValue = {
    isPremium,
    isLoading,
    presentPaywall,
    paywallVisible,
    paywallContext,
    dismissPaywall,
    refreshEntitlement,
  };

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
};

export const usePremium = (): EntitlementsContextValue => {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) {
    throw new Error('usePremium must be used within EntitlementsProvider');
  }
  return ctx;
};
