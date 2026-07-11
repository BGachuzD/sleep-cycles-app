// src/hooks/useHealthKit.ts
//
// Hook + Provider único de UI para HealthKit. Encapsula:
// - detección de disponibilidad
// - estado de autorización persistido en AsyncStorage
// - tracking de qué entries del log fueron importadas (para badges)
// - flag de dismiss del banner "Conecta con Salud"
//
// Importante: se expone como CONTEXT (no como hook independiente). Un solo
// HealthKitProvider en el árbol garantiza que SleepLogScreen, StatsScreen y
// SettingsScreen comparten el mismo state. Sin esto, cada pantalla tendría
// su propia copia del state y un `resetConnection()` desde Settings no
// actualizaría el banner en las otras pantallas.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  fetchSleepDataForDate,
  fetchSleepDataForRange,
  hasHealthKitPermissions,
  isHealthKitAvailable,
  requestHealthKitPermissions,
  type HealthKitSleepEntry,
} from '../services/healthKitService';

const AUTHORIZED_KEY = 'healthkit:authorized';
const IMPORTED_IDS_KEY = 'healthkit:imported_ids';
const BANNER_DISMISSED_KEY = 'healthkit:banner_dismissed';
const HISTORICAL_SYNCED_KEY = 'healthkit:historical_synced';

const ALL_HK_KEYS = [
  AUTHORIZED_KEY,
  IMPORTED_IDS_KEY,
  BANNER_DISMISSED_KEY,
  HISTORICAL_SYNCED_KEY,
];

export type UseHealthKit = {
  /** True si el dispositivo puede usar HealthKit (iOS hardware con HK). */
  isAvailable: boolean;
  /** True si el usuario autorizó la lectura (cacheado en AsyncStorage). */
  isAuthorized: boolean;
  /** True mientras el provider está verificando disponibilidad/permisos al mount. */
  isLoading: boolean;
  /** True si el usuario dismisseó el banner "Conecta con Salud". */
  isBannerDismissed: boolean;
  /** Pide permisos al usuario. Devuelve si fueron concedidos. */
  requestPermissions: () => Promise<boolean>;
  /** Lee un único día. */
  fetchForDate: (date: string) => Promise<HealthKitSleepEntry | null>;
  /** Lee un rango de fechas. */
  fetchForRange: (start: string, end: string) => Promise<HealthKitSleepEntry[]>;
  /** Marca una entry del log como "importada de HealthKit" (para badges). */
  markImported: (entryId: string) => Promise<void>;
  /** Marca varios ids como importados en una operación. */
  markManyImported: (entryIds: string[]) => Promise<void>;
  /** Verifica si una entry del log fue importada desde HealthKit. */
  isImported: (entryId: string) => boolean;
  /** Oculta el banner y persiste el flag. */
  dismissBanner: () => Promise<void>;
  /**
   * Resetea el estado local de la integración: olvida la autorización
   * cacheada, los ids marcados como importados, el flag de banner dismiss
   * y el flag de sync histórico. Útil para volver al estado inicial.
   * Nota: NO revoca el permiso en iOS (eso solo lo hace el usuario desde
   * Ajustes → Privacidad → Salud).
   */
  resetConnection: () => Promise<void>;
  /**
   * Limpia solo el flag de sync histórico. La próxima vez que el usuario
   * abra StatsScreen, se volverá a disparar la importación de 30 días.
   */
  clearHistoricalSync: () => Promise<void>;
};

const HealthKitContext = createContext<UseHealthKit | undefined>(undefined);

export const HealthKitProvider = ({ children }: { children: ReactNode }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  // Inicialización al montar
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Disponibilidad
      const available = await isHealthKitAvailable();
      if (cancelled) return;
      setIsAvailable(available);

      // 2. Cargar flag de banner dismiss (independiente de disponibilidad)
      try {
        const dismissed = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
        if (!cancelled && dismissed === 'true') {
          setIsBannerDismissed(true);
        }
      } catch (err) {
        console.warn('[HealthKit] could not read banner dismiss flag', err);
      }

      // 3. Cargar set de ids importadas (para badges)
      try {
        const raw = await AsyncStorage.getItem(IMPORTED_IDS_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setImportedIds(new Set(parsed));
          }
        }
      } catch (err) {
        console.warn('[HealthKit] could not read imported ids', err);
      }

      if (!available) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // 4. Cache de autorización (para no preguntar a iOS en cada mount)
      try {
        const cachedAuth = await AsyncStorage.getItem(AUTHORIZED_KEY);
        if (cachedAuth === 'true' && !cancelled) {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.warn('[HealthKit] could not read cache', err);
      }

      // 5. Verificación contra el sistema (puede revocarse desde Settings → Salud)
      const realAuth = await hasHealthKitPermissions();
      if (cancelled) return;
      setIsAuthorized(realAuth);
      AsyncStorage.setItem(AUTHORIZED_KEY, realAuth ? 'true' : 'false').catch(
        () => {},
      );

      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const granted = await requestHealthKitPermissions();
    setIsAuthorized(granted);
    try {
      await AsyncStorage.setItem(AUTHORIZED_KEY, granted ? 'true' : 'false');
    } catch (err) {
      console.warn('[HealthKit] could not persist auth state', err);
    }
    return granted;
  }, []);

  const fetchForDate = useCallback(
    async (date: string): Promise<HealthKitSleepEntry | null> => {
      if (!isAuthorized) return null;
      return fetchSleepDataForDate(date);
    },
    [isAuthorized],
  );

  const fetchForRange = useCallback(
    async (start: string, end: string): Promise<HealthKitSleepEntry[]> => {
      if (!isAuthorized) return [];
      return fetchSleepDataForRange(start, end);
    },
    [isAuthorized],
  );

  const persistImported = useCallback(async (next: Set<string>) => {
    try {
      await AsyncStorage.setItem(IMPORTED_IDS_KEY, JSON.stringify([...next]));
    } catch (err) {
      console.warn('[HealthKit] could not persist imported ids', err);
    }
  }, []);

  const markImported = useCallback(
    async (entryId: string) => {
      setImportedIds((prev) => {
        if (prev.has(entryId)) return prev;
        const next = new Set(prev);
        next.add(entryId);
        persistImported(next);
        return next;
      });
    },
    [persistImported],
  );

  const markManyImported = useCallback(
    async (entryIds: string[]) => {
      if (entryIds.length === 0) return;
      setImportedIds((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const id of entryIds) {
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        }
        if (changed) persistImported(next);
        return next;
      });
    },
    [persistImported],
  );

  const isImported = useCallback(
    (entryId: string): boolean => importedIds.has(entryId),
    [importedIds],
  );

  const dismissBanner = useCallback(async () => {
    setIsBannerDismissed(true);
    try {
      await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch (err) {
      console.warn('[HealthKit] could not persist banner dismiss', err);
    }
  }, []);

  const resetConnection = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(ALL_HK_KEYS);
    } catch (err) {
      console.warn('[HealthKit] could not clear keys', err);
    }
    setIsAuthorized(false);
    setImportedIds(new Set());
    setIsBannerDismissed(false);
  }, []);

  const clearHistoricalSync = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(HISTORICAL_SYNCED_KEY);
    } catch (err) {
      console.warn('[HealthKit] could not clear historical sync flag', err);
    }
  }, []);

  const value: UseHealthKit = useMemo(
    () => ({
      isAvailable,
      isAuthorized,
      isLoading,
      isBannerDismissed,
      requestPermissions,
      fetchForDate,
      fetchForRange,
      markImported,
      markManyImported,
      isImported,
      dismissBanner,
      resetConnection,
      clearHistoricalSync,
    }),
    [
      isAvailable,
      isAuthorized,
      isLoading,
      isBannerDismissed,
      requestPermissions,
      fetchForDate,
      fetchForRange,
      markImported,
      markManyImported,
      isImported,
      dismissBanner,
      resetConnection,
      clearHistoricalSync,
    ],
  );

  return (
    <HealthKitContext.Provider value={value}>
      {children}
    </HealthKitContext.Provider>
  );
};

export function useHealthKit(): UseHealthKit {
  const ctx = useContext(HealthKitContext);
  if (!ctx) {
    throw new Error('useHealthKit must be used within a HealthKitProvider');
  }
  return ctx;
}
