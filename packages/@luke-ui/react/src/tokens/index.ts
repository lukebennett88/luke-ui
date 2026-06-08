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

/** Converts a `ColorTokenValue` to a CSS color string. */
export { colorToCssString } from './converters.js';
/** Converts a `CubicBezierTokenValue` to a `cubic-bezier(...)` CSS string. */
export { cubicBezierToString } from './converters.js';
/** Converts a `DimensionTokenValue` to a rem string. */
export { dimensionToRemString } from './converters.js';
/** Converts a `DurationTokenValue` to a CSS time string. */
export { durationToString } from './converters.js';
/** Returns the token names from a `DesignTokenGroup`, excluding the `$type` key. */
export { tokenKeys } from './groups.js';
/** Constructs a typed `DesignTokenGroup` from a type string and a values record. */
export { toTokenGroup } from './groups.js';
/** Prebuilt `@media (width >= ...)` query strings keyed by breakpoint name. */
export { minMediaQueries } from './media-queries.js';
/** The available breakpoint names (e.g. `'small' | 'medium' | ...`). */
export type { Breakpoint } from './media-queries.js';
/** Token values for border radius. */
export { borderRadiusValues } from './values.js';
/** Token values for border width. */
export { borderWidthValues } from './values.js';
/** Token values for box shadow. */
export { boxShadowValues } from './values.js';
/** Token values for responsive breakpoints. */
export { breakpointValues } from './values.js';
/** Token values for control (interactive element) sizes. */
export { controlSizeValues } from './values.js';
/** Token values for font family. */
export { fontFamilyValues } from './values.js';
/** Token values for font size. */
export { fontSizeValues } from './values.js';
/** Token values for font weight. */
export { fontWeightValues } from './values.js';
/** Token values for icon size. */
export { iconSizeValues } from './values.js';
/** Token values for line height. */
export { lineHeightValues } from './values.js';
/** Token values for motion (animation) duration. */
export { motionDurationValues } from './values.js';
/** Token values for motion easing curves. */
export { motionEasingValues } from './values.js';
/** Token values for spacing. */
export { spaceValues } from './values.js';

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
