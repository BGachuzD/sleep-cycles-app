// src/hooks/useHealthKit.ts
//
// Hook único de UI para HealthKit. Encapsula:
// - detección de disponibilidad
// - estado de autorización persistido en AsyncStorage
// - tracking de qué entries del log fueron importadas (para badges)

import { useCallback, useEffect, useState } from 'react';
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

export type UseHealthKit = {
  /** True si el dispositivo puede usar HealthKit (iOS hardware con HK). */
  isAvailable: boolean;
  /** True si el usuario autorizó la lectura (cacheado en AsyncStorage). */
  isAuthorized: boolean;
  /** True mientras el hook está verificando disponibilidad/permisos al mount. */
  isLoading: boolean;
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
};

export function useHealthKit(): UseHealthKit {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  // Inicialización al montar
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Disponibilidad
      const available = await isHealthKitAvailable();
      if (cancelled) return;
      setIsAvailable(available);

      if (!available) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // 2. Cache de autorización (para no preguntar a iOS en cada mount)
      try {
        const cachedAuth = await AsyncStorage.getItem(AUTHORIZED_KEY);
        if (cachedAuth === 'true' && !cancelled) {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.warn('[HealthKit] could not read cache', err);
      }

      // 3. Verificación contra el sistema (puede revocarse desde Settings → Salud)
      const realAuth = await hasHealthKitPermissions();
      if (cancelled) return;
      setIsAuthorized(realAuth);
      AsyncStorage.setItem(AUTHORIZED_KEY, realAuth ? 'true' : 'false').catch(
        () => {},
      );

      // 4. Cargar set de ids importadas (para badges)
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
      await AsyncStorage.setItem(
        IMPORTED_IDS_KEY,
        JSON.stringify([...next]),
      );
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

  return {
    isAvailable,
    isAuthorized,
    isLoading,
    requestPermissions,
    fetchForDate,
    fetchForRange,
    markImported,
    markManyImported,
    isImported,
  };
}
