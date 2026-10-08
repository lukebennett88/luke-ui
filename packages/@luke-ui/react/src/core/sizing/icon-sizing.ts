import type { IconSize } from '../types/icon-size.js';

/** Shared viewBox size for icon SVGs. */
export const ICON_VIEWBOX_SIZE = 24;

/** Inset from viewBox edge to content; icons use 19×19 content in 24×24 box. */
const ICON_CONTENT_INSET = 2.5;

/** Content area size (viewBox size minus insets). */
const ICON_CONTENT_SIZE = ICON_VIEWBOX_SIZE - 2 * ICON_CONTENT_INSET;

/** Default viewBox string for icon-aligned SVGs. */
export const ICON_VIEWBOX = `0 0 ${ICON_VIEWBOX_SIZE} ${ICON_VIEWBOX_SIZE}`;

/** Stroke width for loading spinner. */
export const SPINNER_STROKE_WIDTH = 2;

/** Radius inset by half stroke so the stroke's outer edge aligns with icon content (19px). */
export const SPINNER_CIRCLE_RADIUS = (ICON_CONTENT_SIZE - SPINNER_STROKE_WIDTH) / 2;

/**
 * Inline and block size for each `Icon` size step, at a 16px root: 16, 20, 24, and 32px. Private
 * geometry: components size their own icon slots from it.
 */
export const ICON_SIZES = {
	xsmall: '1rem',
	small: '1.25rem',
	medium: '1.5rem',
	large: '2rem',
} as const satisfies Record<IconSize, string>;
