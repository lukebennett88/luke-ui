/** Shared viewBox size for icon SVGs (icons and LoadingSpinner). */
export const ICON_VIEWBOX_SIZE = 24;

/** Inset from viewBox edge to content; icons use 19×19 content in 24×24 box. */
const ICON_CONTENT_INSET = 2.5;

/** Content area size (viewBox size minus insets). */
const ICON_CONTENT_SIZE = ICON_VIEWBOX_SIZE - 2 * ICON_CONTENT_INSET;

/** Default viewBox string for icon-aligned SVGs. */
export const ICON_VIEWBOX = `0 0 ${ICON_VIEWBOX_SIZE} ${ICON_VIEWBOX_SIZE}`;

export const SPINNER_STROKE_WIDTH = 2;

/** Radius inset by half stroke so the stroke's outer edge aligns with icon content (19px). */
export const SPINNER_CIRCLE_RADIUS = (ICON_CONTENT_SIZE - SPINNER_STROKE_WIDTH) / 2;
