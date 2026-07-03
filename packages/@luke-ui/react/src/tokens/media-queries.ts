import { typedKeys } from '../utils/index.js';
import { dimensionToRemString } from './converters.js';
import { breakpointValues } from './values.js';

/** The available breakpoint names (e.g. `'small' | 'medium' | ...`). */
export type Breakpoint = keyof typeof breakpointValues;

/** Prebuilt `@media (width >= ...)` query strings keyed by breakpoint name. */
export const minMediaQueries = Object.fromEntries(
	typedKeys(breakpointValues).map((breakpoint) => [
		breakpoint,
		`@media(width >= ${dimensionToRemString(breakpointValues[breakpoint])})`,
	]),
) as Record<Breakpoint, string>;
