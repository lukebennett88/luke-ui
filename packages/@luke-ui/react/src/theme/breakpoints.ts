/**
 * The private responsive breakpoint widths, in pixels. A media query cannot read a custom property,
 * so these are never emitted as one and are resolved in TypeScript instead.
 *
 * The styling utilities turn them into media queries, and `useIsMobileDevice` treats a device screen
 * below `small` as mobile.
 */

/** The retained breakpoint widths, from the narrowest to the widest. */
export const breakpoints = {
	small: 640,
	medium: 768,
	large: 1024,
	xlarge: 1280,
	xxlarge: 1536,
} as const;
