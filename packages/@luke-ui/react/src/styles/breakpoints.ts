/**
 * The responsive breakpoint widths, in pixels. Kept in a plain module so runtime
 * code can read a value without pulling in Vanilla Extract.
 *
 * The styling utilities turn these into media queries, and `useIsMobileDevice`
 * treats anything below `small` as a mobile device.
 */
export const breakpoints = {
	small: 640,
	medium: 768,
	large: 1024,
	xlarge: 1280,
	xxlarge: 1536,
} as const;
