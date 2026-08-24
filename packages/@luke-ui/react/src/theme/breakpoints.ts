/**
 * The private responsive breakpoint widths, in pixels. A container query cannot read a custom
 * property, so these are never emitted as one and are resolved in TypeScript instead.
 *
 * The styling utilities turn them into minimum container inline sizes, and `useIsMobileDevice`
 * treats a device screen narrower than 640px as mobile.
 */

/** The retained breakpoint widths, from the narrowest to the widest. */
export const breakpoints = {
	'640': 640,
	'768': 768,
	'1024': 1024,
	'1280': 1280,
	'1536': 1536,
} as const;
