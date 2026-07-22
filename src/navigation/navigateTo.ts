// src/navigation/navigateTo.ts
//
// Navegación robusta por nombre de pantalla en una app con tabs.
//
// PROBLEMA: con bottom-tabs, cada tab tiene su propio stack. `navigate('Nap')`
// desde un tab distinto FALLA — React Navigation solo busca hacia arriba (a los
// padres), no dentro de los stacks hermanos, así que no encuentra la ruta.
//
// SOLUCIÓN: navegar primero al TAB dueño de la pantalla y luego a la pantalla:
// `navigate('Inicio', { screen: 'Nap' })`. Funciona desde cualquier tab, e
// incluso dentro del mismo (navega en el stack actual).

type TabName = 'Inicio' | 'Diario' | 'Progreso' | 'Mas';

const SCREEN_TO_TAB: Record<string, TabName> = {
  // Tab Inicio
  Home: 'Inicio',
  SmartWake: 'Inicio',
  SleepNow: 'Inicio',
  WakeAt: 'Inicio',
  Nap: 'Inicio',
  SleepRoutine: 'Inicio',
  // Tab Diario
  SleepLog: 'Diario',
  DreamJournal: 'Diario',
  // Tab Progreso (la raíz es 'ProgresoHome' para no chocar con el tab 'Progreso')
  ProgresoHome: 'Progreso',
  Stats: 'Progreso',
  // Tab Más (la raíz es 'MasHome' para no chocar con el tab 'Mas')
  MasHome: 'Mas',
  SleepProfile: 'Mas',
  Notifications: 'Mas',
  Settings: 'Mas',
  DeleteAccount: 'Mas',
};

/**
 * Navega a `screen` resolviendo su tab. Acepta cualquier objeto de navegación
 * (el tipado de useNavigation es demasiado estricto para pasarlo directo).
 */
export function navigateToScreen(navigation: unknown, screen: string): void {
  const nav = navigation as {
    navigate: (name: string, params?: object) => void;
  };
  const tab = SCREEN_TO_TAB[screen];
  if (tab) {
    nav.navigate(tab, { screen });
  } else {
    nav.navigate(screen);
  }
}
