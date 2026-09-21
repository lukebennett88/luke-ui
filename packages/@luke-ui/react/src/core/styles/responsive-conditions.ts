import { breakpoints } from '../../theme/breakpoints.js';

function fromBreakpoint(minimumInlineSize: number) {
	return { '@container': `(inline-size >= ${minimumInlineSize}px)` };
}

/**
 * Container-query conditions for responsive props. Shared by Sprinkles and layout helpers so
 * breakpoint names and query sizes stay one source of truth.
 */
export const responsiveConditions = {
	initial: {},
	bp640: fromBreakpoint(breakpoints.bp640),
	bp768: fromBreakpoint(breakpoints.bp768),
	bp1024: fromBreakpoint(breakpoints.bp1024),
	bp1280: fromBreakpoint(breakpoints.bp1280),
	bp1536: fromBreakpoint(breakpoints.bp1536),
} as const;

/** Breakpoint keys accepted by responsive props. */
export type ResponsiveCondition = keyof typeof responsiveConditions;
