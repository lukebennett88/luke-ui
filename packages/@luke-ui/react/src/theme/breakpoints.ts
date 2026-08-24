/**
 * The private responsive breakpoint inline sizes, in pixels. A container query cannot read a
 * custom property, so these are never emitted as one and are resolved in TypeScript instead.
 *
 * The styling utilities turn them into minimum container inline sizes, and `useIsMobileDevice`
 * treats a device screen narrower than 640px as mobile.
 */

/** The retained breakpoint inline sizes, from the narrowest to the widest. */
export const breakpoints = {
	bp640: 640,
	bp768: 768,
	bp1024: 1024,
	bp1280: 1280,
	bp1536: 1536,
} as const;
