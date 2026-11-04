import type { IconSize } from '../types/icon-size.js';

/** Complete recipe sizes shared by compatible controls and actions. */
export type ControlSize = 'small' | 'medium';

/**
 * Maps field control size to the icon size those controls provide: `size.16` icons at `small`, and
 * `size.20` icons at `medium`.
 */
export const FIELD_CONTROL_ICON_SIZE: Record<ControlSize, IconSize> = {
	small: 'size.16',
	medium: 'size.20',
};

/**
 * Minimum block and inline size of an interactive target. WCAG 2.5.8 asks for 24 CSS pixels, so the
 * `max()` keeps that floor when an application sets a root font size below 16px.
 */
export const MIN_TARGET_SIZE = 'max(1.5rem, 24px)';
