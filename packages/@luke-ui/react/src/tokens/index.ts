import {
	backgroundColorTokenValues,
	borderColorTokenValues,
	foregroundColorTokenValues,
	themeColorTokenValues,
} from '../../.generated/color-tokens.generated.js';
import { toTokenGroup } from './groups.js';
import { minMediaQueries } from './media-queries.js';
import {
	borderRadiusValues,
	borderWidthValues,
	boxShadowValues,
	breakpointValues,
	controlSizeValues,
	fontFamilyValues,
	fontSizeValues,
	fontWeightValues,
	iconSizeValues,
	lineHeightValues,
	motionDurationValues,
	motionEasingValues,
	spaceValues,
} from './values.js';

/** Structured value for a dimension token, expressed in px or rem. */
export interface DimensionTokenValue {
	unit: 'px' | 'rem';
	value: number;
}

/** Structured value for a duration token, expressed in ms or s. */
export interface DurationTokenValue {
	unit: 'ms' | 's';
	value: number;
}

/** Structured value for a color token with optional alpha and color-space components. */
export interface ColorTokenValue {
	alpha?: number;
	colorSpace: string;
	components: Array<number>;
}

/** Structured value for a cubic-bezier easing token as a 4-number tuple. */
export type CubicBezierTokenValue = readonly [number, number, number, number];

/** A single design token wrapping a typed value. */
export type DesignToken<TValue> = {
	$value: TValue;
};

/** A group of design tokens sharing a common `$type`, keyed by token name. */
export type DesignTokenGroup<TType extends string, TValues extends Record<string, unknown>> = {
	$type: TType;
} & {
	[Key in keyof TValues]: DesignToken<TValues[Key]>;
};

/** Extracts the string token names from a `DesignTokenGroup`, excluding `$type`. */
export type TokenName<TGroup extends { $type: string }> = Extract<
	Exclude<keyof TGroup, '$type'>,
	string
>;

export {
	colorToCssString,
	cubicBezierToString,
	dimensionToRemString,
	durationToString,
	isColorTokenValue,
	toCssValue,
} from './converters.js';
export { tokenKeys, toTokenGroup } from './groups.js';
export type { Breakpoint } from './media-queries.js';
export { minMediaQueries } from './media-queries.js';
export {
	borderRadiusValues,
	borderWidthValues,
	boxShadowValues,
	breakpointValues,
	controlSizeValues,
	fontFamilyValues,
	fontSizeValues,
	fontWeightValues,
	iconSizeValues,
	lineHeightValues,
	motionDurationValues,
	motionEasingValues,
	spaceValues,
} from './values.js';

/** The complete design-token object, grouped by category, ready to use in vanilla-extract themes. */
export const tokens = {
	backgroundColor: toTokenGroup('color', backgroundColorTokenValues),
	borderColor: toTokenGroup('color', borderColorTokenValues),
	borderRadius: toTokenGroup('dimension', borderRadiusValues),
	borderWidth: toTokenGroup('dimension', borderWidthValues),
	boxShadow: toTokenGroup('string', boxShadowValues),
	breakpoints: toTokenGroup('dimension', breakpointValues),
	controlSize: toTokenGroup('dimension', controlSizeValues),
	fontFamily: toTokenGroup('fontFamily', fontFamilyValues),
	fontSize: toTokenGroup('dimension', fontSizeValues),
	fontWeight: toTokenGroup('fontWeight', fontWeightValues),
	foregroundColor: toTokenGroup('color', foregroundColorTokenValues),
	iconSize: toTokenGroup('dimension', iconSizeValues),
	lineHeight: toTokenGroup('number', lineHeightValues),
	mediaQueries: {
		min: toTokenGroup('mediaQuery', minMediaQueries),
	},
	motionDuration: toTokenGroup('duration', motionDurationValues),
	motionEasing: toTokenGroup('cubicBezier', motionEasingValues),
	space: toTokenGroup('dimension', spaceValues),
	themeColor: toTokenGroup('color', themeColorTokenValues),
} as const;

/** The full type of the `tokens` object. */
export type Tokens = typeof tokens;
/** Union of valid control-size token names. */
export type ControlSizeToken = TokenName<Tokens['controlSize']>;
/** Union of valid font-family token names. */
export type FontFamilyToken = TokenName<Tokens['fontFamily']>;
/** Union of valid font-size token names. */
export type FontSizeToken = TokenName<Tokens['fontSize']>;
/** Union of valid font-weight token names. */
export type FontWeightToken = TokenName<Tokens['fontWeight']>;
/** Union of valid foreground-color token names. */
export type ForegroundColorToken = TokenName<Tokens['foregroundColor']>;
/** Union of valid icon-size token names. */
export type IconSizeToken = TokenName<Tokens['iconSize']>;
/** Union of valid line-height token names. */
export type LineHeightToken = TokenName<Tokens['lineHeight']>;
