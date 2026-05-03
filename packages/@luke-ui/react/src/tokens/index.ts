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

export interface DimensionTokenValue {
	unit: 'px' | 'rem';
	value: number;
}

export interface DurationTokenValue {
	unit: 'ms' | 's';
	value: number;
}

export interface ColorTokenValue {
	alpha?: number;
	colorSpace: string;
	components: Array<number>;
}

export type CubicBezierTokenValue = readonly [number, number, number, number];

export type DesignToken<TValue> = {
	$value: TValue;
};

export type DesignTokenGroup<TType extends string, TValues extends Record<string, unknown>> = {
	$type: TType;
} & {
	[Key in keyof TValues]: DesignToken<TValues[Key]>;
};

export type TokenName<TGroup extends { $type: string }> = Extract<
	Exclude<keyof TGroup, '$type'>,
	string
>;

export {
	colorToCssString,
	cubicBezierToString,
	dimensionToRemString,
	durationToString,
} from './converters.js';
export { tokenKeys, toTokenGroup } from './groups.js';
export { minMediaQueries } from './media-queries.js';
export type { Breakpoint } from './media-queries.js';
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

export type Tokens = typeof tokens;
export type ControlSizeToken = TokenName<Tokens['controlSize']>;
export type FontFamilyToken = TokenName<Tokens['fontFamily']>;
export type FontSizeToken = TokenName<Tokens['fontSize']>;
export type FontWeightToken = TokenName<Tokens['fontWeight']>;
export type ForegroundColorToken = TokenName<Tokens['foregroundColor']>;
export type IconSizeToken = TokenName<Tokens['iconSize']>;
export type LineHeightToken = TokenName<Tokens['lineHeight']>;
