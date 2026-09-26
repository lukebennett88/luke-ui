/**
 * Fixed minimum container inline sizes in CSS pixels.
 *
 * Luke UI responsive props use these thresholds against the nearest size container. Import
 * `breakpoints` from `@luke-ui/react/styles` when authoring your own `@container` queries so custom
 * CSS tracks the same sizes. Values stay in TypeScript because container-query conditions cannot
 * use custom properties, and they are not themeable.
 */
export const breakpoints = {
	bp640: 640,
	bp768: 768,
	bp1024: 1024,
	bp1280: 1280,
	bp1536: 1536,
} as const;
