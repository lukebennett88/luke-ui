import { breakpoints, vars } from '@luke-ui/react/theme';
import { TOUCH_TARGET } from './sizes.js';

/**
 * Style pieces the app's stylesheets repeat. They are plain objects for Vanilla Extract's `style`,
 * kept out of a `.css.ts` module so a function export loads anywhere.
 */

/** The phone layout: the root container narrower than the tablet breakpoint. */
export const PHONE = `(inline-size < ${breakpoints.bp768}px)`;

/**
 * An example's corner radius: the radius of the controls in its header plus the header's padding,
 * so the corners are concentric with them.
 */
export const SECTION_RADIUS = `calc(${vars.radius.control} + ${vars.space['8']})`;

/** The padding between the main panel's edge and its examples. */
export const MAIN_PADDING = vars.space['24'];

/** The main panel's corner radius, concentric with its examples' corners. */
export const MAIN_RADIUS = `calc(${SECTION_RADIUS} + ${MAIN_PADDING})`;

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** A control at least a touch target tall. Phones set it inside a `PHONE` container query. */
export const touchTargetHeight = { minBlockSize: `${TOUCH_TARGET}px` } as const;

/** A control at least a touch target tall and wide. */
export const touchTargetSize = {
	minBlockSize: `${TOUCH_TARGET}px`,
	minInlineSize: `${TOUCH_TARGET}px`,
} as const;

/** The app's 2px focus ring, `offset` outside the element, or inside it when negative. */
export function focusRing(offset: string) {
	return { outline: `2px solid ${vars.color.focus}`, outlineOffset: offset } as const;
}

/**
 * Turns a style's transition off for a reader who asks for reduced motion. Spread it into a style
 * that sets no other `@media` rule.
 */
export const noTransitionWhenReduced = {
	'@media': { [REDUCED_MOTION]: { transition: 'none' } },
} as const;
