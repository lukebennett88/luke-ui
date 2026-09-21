import { createVar, style } from '@vanilla-extract/css';
import { layers } from './layers.css.js';
import { responsiveConditions } from './responsive-conditions.js';
import type { ResponsiveCondition } from './responsive-conditions.js';

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
	vars: Record<ResponsiveCondition, string>,
): Record<ResponsiveCondition, string> {
	return {
		initial: style(
			{
				'@layer': {
					[layers.recipes]: wrapConditionStyle(
						toDeclaration(vars.initial),
						responsiveConditions.initial,
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
						responsiveConditions.bp640,
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
						responsiveConditions.bp768,
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
						responsiveConditions.bp1024,
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
						responsiveConditions.bp1280,
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
						responsiveConditions.bp1536,
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
	vars: Record<ResponsiveCondition, string>;
	classes: Record<ResponsiveCondition, string>;
} {
	const vars = {
		initial: createVar(`${name}-initial`),
		bp640: createVar(`${name}-bp640`),
		bp768: createVar(`${name}-bp768`),
		bp1024: createVar(`${name}-bp1024`),
		bp1280: createVar(`${name}-bp1280`),
		bp1536: createVar(`${name}-bp1536`),
	} as const satisfies Record<ResponsiveCondition, string>;

	return {
		classes: createConditionStyles(name, toDeclaration, vars),
		vars,
	};
}
