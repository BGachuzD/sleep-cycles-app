import { describe, expect, it } from '@jest/globals';

import {
  getTabBarContentPadding,
  getTabBarOverlayHeight,
  TAB_BAR_BOTTOM_OFFSET,
  TAB_BAR_CONTENT_GAP,
  TAB_BAR_HEIGHT,
  TAB_BAR_TOP_PADDING,
} from './tabBarMetrics';

describe('tab bar layout', () => {
  it('usa el offset mínimo cuando el dispositivo no tiene inset inferior', () => {
    expect(getTabBarOverlayHeight(0)).toBe(
      TAB_BAR_TOP_PADDING + TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_OFFSET,
    );
  });

  it('incluye el home indicator y el espacio desplazable', () => {
    const homeIndicatorInset = 34;
    expect(getTabBarContentPadding(homeIndicatorInset)).toBe(
      TAB_BAR_TOP_PADDING +
        TAB_BAR_HEIGHT +
        homeIndicatorInset +
        TAB_BAR_CONTENT_GAP,
    );
  });
});
