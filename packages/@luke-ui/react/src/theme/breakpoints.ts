/**
 * Responsive breakpoint inline sizes in CSS pixels.
 * Kept in TypeScript because container query conditions cannot use custom properties.
 */
export const breakpoints = {
	bp640: 640,
	bp768: 768,
	bp1024: 1024,
	bp1280: 1280,
	bp1536: 1536,
} as const;
