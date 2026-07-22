import { describe, expect, it, jest } from '@jest/globals';

import { navigateToScreen } from './navigateTo';

describe('navigateToScreen', () => {
  it('conserva la raíz del tab al abrir estadísticas desde otro tab', () => {
    const navigate = jest.fn();

    navigateToScreen({ navigate }, 'Stats');

    expect(navigate).toHaveBeenCalledWith('Progreso', {
      screen: 'Stats',
      initial: false,
    });
  });

  it('abre la raíz de Progreso sin crear una pantalla anterior artificial', () => {
    const navigate = jest.fn();

    navigateToScreen({ navigate }, 'ProgresoHome');

    expect(navigate).toHaveBeenCalledWith('Progreso', {
      screen: 'ProgresoHome',
    });
  });
});
