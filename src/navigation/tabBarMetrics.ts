import { spacing } from '../theme/theme';

/** Dimensiones operativas del tab bar; no alteran su diseño visual. */
export const TAB_BAR_HEIGHT = 70;
export const TAB_BAR_TOP_PADDING = spacing.sm;
export const TAB_BAR_BOTTOM_OFFSET = spacing.sm;
export const TAB_BAR_CONTENT_GAP = spacing.xxl;

export function getTabBarOverlayHeight(bottomInset: number): number {
  return (
    TAB_BAR_TOP_PADDING +
    TAB_BAR_HEIGHT +
    Math.max(bottomInset, TAB_BAR_BOTTOM_OFFSET)
  );
}

export function getTabBarContentPadding(bottomInset: number): number {
  return getTabBarOverlayHeight(bottomInset) + TAB_BAR_CONTENT_GAP;
}
