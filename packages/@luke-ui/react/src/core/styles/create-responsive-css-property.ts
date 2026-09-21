import { createVar, style } from '@vanilla-extract/css';
import { breakpoints } from '../../theme/breakpoints.js';
import { layers } from './layers.css.js';
import type { ResponsiveCondition } from './responsive.js';

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
} as const satisfies Record<ResponsiveCondition, { '@container'?: string }>;

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

function createConditionStyles(
	name: string,
	toDeclaration: (cssVar: string) => Record<string, string>,
	vars: Record<ResponsiveStyleBreakpoint, string>,
): Record<ResponsiveStyleBreakpoint, string> {
	return {
		initial: style(
			{
				'@layer': {
					[layers.recipes]: wrapConditionStyle(
						toDeclaration(vars.initial),
						responsiveStyleConditions.initial,
					),
				},
			},
			`${name}-initial`,
		),
		bp640: style(
			{
				'@layer': {
					[layers.recipes]: wrapConditionStyle(
						toDeclaration(vars.bp640),
						responsiveStyleConditions.bp640,
					),
				},
			},
			`${name}-bp640`,
		),
		bp768: style(
			{
				'@layer': {
					[layers.recipes]: wrapConditionStyle(
						toDeclaration(vars.bp768),
						responsiveStyleConditions.bp768,
					),
				},
			},
			`${name}-bp768`,
		),
		bp1024: style(
			{
				'@layer': {
					[layers.recipes]: wrapConditionStyle(
						toDeclaration(vars.bp1024),
						responsiveStyleConditions.bp1024,
					),
				},
			},
			`${name}-bp1024`,
		),
		bp1280: style(
			{
				'@layer': {
					[layers.recipes]: wrapConditionStyle(
						toDeclaration(vars.bp1280),
						responsiveStyleConditions.bp1280,
					),
				},
			},
			`${name}-bp1280`,
		),
		bp1536: style(
			{
				'@layer': {
					[layers.recipes]: wrapConditionStyle(
						toDeclaration(vars.bp1536),
						responsiveStyleConditions.bp1536,
					),
				},
			},
			`${name}-bp1536`,
		),
	};
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
	const vars = {
		initial: createVar(`${name}-initial`),
		bp640: createVar(`${name}-bp640`),
		bp768: createVar(`${name}-bp768`),
		bp1024: createVar(`${name}-bp1024`),
		bp1280: createVar(`${name}-bp1280`),
		bp1536: createVar(`${name}-bp1536`),
	} as const satisfies Record<ResponsiveStyleBreakpoint, string>;

	return {
		classes: createConditionStyles(name, toDeclaration, vars),
		vars,
	};
}
