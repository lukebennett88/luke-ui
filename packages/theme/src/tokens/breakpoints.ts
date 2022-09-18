const breakpointScale = [0, 640, 768, 1024, 1280, 1536] as const;

/** Breakpoint tokens */
const breakpoint = {
	none: breakpointScale[0],
	small: breakpointScale[1],
	medium: breakpointScale[2],
	large: breakpointScale[3],
	xlarge: breakpointScale[4],
	xxlarge: breakpointScale[5],
};

type Breakpoint = keyof typeof breakpoint;

/** Media queries */
const mediaQuery = {
	/** 639px and above */
	small: `@media (min-width: ${breakpoint.small / 16}em)`,

	/** 768px and above */
	medium: `@media (min-width: ${breakpoint.medium / 16}em)`,

	/** 1024px and above */
	large: `@media (min-width: ${breakpoint.large / 16}em)`,

	/** 1280px and above */
	xlarge: `@media (min-width: ${breakpoint.xlarge / 16}em)`,

	/** 1536px and above */
	xxlarge: `@media (min-width: ${breakpoint.xxlarge / 16}em)`,
};

////////////////////////////////////////////////////////////////////////////////

export { breakpoint, mediaQuery };
export type { Breakpoint };
