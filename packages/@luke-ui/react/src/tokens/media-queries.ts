import { typedKeys } from '../utils/index.js';
import { dimensionToRemString } from './converters.js';
import { breakpointValues } from './values.js';

export type Breakpoint = keyof typeof breakpointValues;

export const minMediaQueries = Object.fromEntries(
	typedKeys(breakpointValues).map((breakpoint) => [
		breakpoint,
		`@media(width >= ${dimensionToRemString(breakpointValues[breakpoint])})`,
	]),
) as Record<Breakpoint, string>;
