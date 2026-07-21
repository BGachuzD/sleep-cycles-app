import React from 'react';

interface Props {
  /** Se conserva por compatibilidad con las pantallas que aún lo pasan. */
  insideSafeArea?: boolean;
}

/**
 * Obsoleto tras migrar de drawer a tabs (Fase 5). Se deja como no-op para no
 * tener que editar todas las pantallas que aún lo renderizan; no dibuja nada.
 * La navegación ahora vive en la barra de tabs inferior.
 */
export const FloatingDrawerButton: React.FC<Props> = () => null;
