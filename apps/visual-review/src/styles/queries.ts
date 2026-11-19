import { breakpoints } from '@luke-ui/react/theme';

/**
 * The root container's name. Luke UI makes the root the container that unnamed size queries
 * measure, but an example section is a container too, and inside it an unnamed query would measure
 * the section. Naming the root keeps every layout query below on the viewport's width, as
 * `layout-hooks.ts` measures it.
 */
export const ROOT_CONTAINER = 'visual-review';

/** The phone layout. `layout-hooks.ts` matches the same width. */
export const compactQuery = `${ROOT_CONTAINER} (inline-size < ${breakpoints.bp768}px)`;
export const regularQuery = `${ROOT_CONTAINER} (inline-size >= ${breakpoints.bp768}px)`;
/** Wide enough for the PR title in the top bar and Contents beside the captures. */
export const wideQuery = `${ROOT_CONTAINER} (inline-size >= ${breakpoints.bp1280}px)`;
export const belowWideQuery = `${ROOT_CONTAINER} (inline-size < ${breakpoints.bp1280}px)`;
