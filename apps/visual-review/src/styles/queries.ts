import { breakpoints } from '@luke-ui/react/theme';

/** The phone layout, as a root container query. `layout-hooks.ts` matches the same width. */
export const compactQuery = `(inline-size < ${breakpoints.bp768}px)`;
export const regularQuery = `(inline-size >= ${breakpoints.bp768}px)`;
/** Wide enough for the PR title in the top bar and Contents beside the captures. */
export const wideQuery = `(inline-size >= ${breakpoints.bp1280}px)`;
export const belowWideQuery = `(inline-size < ${breakpoints.bp1280}px)`;
