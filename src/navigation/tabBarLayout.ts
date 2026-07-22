import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getTabBarContentPadding,
  getTabBarOverlayHeight,
} from './tabBarMetrics';

export * from './tabBarMetrics';

/** Espacio desplazable necesario para elevar el último elemento sobre el menú. */
export function useTabBarContentPadding(): number {
  const insets = useSafeAreaInsets();
  return getTabBarContentPadding(insets.bottom);
}

/** Altura ocupada por el menú flotante, útil para footers fijados al fondo. */
export function useTabBarOverlayHeight(): number {
  const insets = useSafeAreaInsets();
  return getTabBarOverlayHeight(insets.bottom);
}
