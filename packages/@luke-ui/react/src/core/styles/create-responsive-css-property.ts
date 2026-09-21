import { createVar, style } from '@vanilla-extract/css';
import { typedEntries, typedFromEntries } from '../../shared/utils/utils.js';
import { breakpoints } from '../../theme/breakpoints.js';
import { layers } from './layers.css.js';

function fromBreakpoint(minimumInlineSize: number) {
	return { '@container': `(inline-size >= ${minimumInlineSize}px)` };
}

/** Container-query conditions shared with Sprinkles responsive props. */
export const responsiveStyleConditions = {
	initial: {},
	bp640: fromBreakpoint(breakpoints.bp640),
	bp768: fromBreakpoint(breakpoints.bp768),
	bp1024: fromBreakpoint(breakpoints.bp1024),
	bp1280: fromBreakpoint(breakpoints.bp1280),
	bp1536: fromBreakpoint(breakpoints.bp1536),
} as const;

/** Breakpoint names accepted by responsive CSS property helpers. */
export type ResponsiveStyleBreakpoint = keyof typeof responsiveStyleConditions;

type ConditionValue = {
	'@container'?: string;
};

function wrapConditionStyle(
	base: Record<string, unknown>,
	condition: ConditionValue,
): Record<string, unknown> {
	if (condition['@container']) {
		return { '@container': { [condition['@container']]: base } };
	}
	return base;
}

/**
 * Builds per-breakpoint CSS variables and classes for one CSS property, using the same container
 * queries as Sprinkles. Call only from `.css.ts` modules.
 */
export function createResponsiveCssProperty(
	name: string,
	toDeclaration: (cssVar: string) => Record<string, string>,
): {
	vars: Record<ResponsiveStyleBreakpoint, string>;
	classes: Record<ResponsiveStyleBreakpoint, string>;
} {
	const vars = typedFromEntries(
		typedEntries(responsiveStyleConditions).map(([conditionName]) => {
			return [conditionName, createVar(`${name}-${conditionName}`)];
		}),
	);

	const classes = typedFromEntries(
		typedEntries(responsiveStyleConditions).map(([conditionName, conditionValue]) => {
			const styleValue = wrapConditionStyle(toDeclaration(vars[conditionName]), conditionValue);
			return [
				conditionName,
				style(
					{
						'@layer': {
							[layers.recipes]: styleValue,
						},
					},
					`${name}-${conditionName}`,
				),
			];
		}),
	);

	return { classes, vars };
}
