import {
	backgroundColorTokenValues,
	borderColorTokenValues,
	foregroundColorTokenValues,
	themeColorTokenValues,
} from '../.generated/color-tokens.generated.js';
import { pxToRem, typedKeys } from './utils.js';

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

function toTokenGroup<TType extends string, TValues extends Record<string, unknown>>(
	type: TType,
	values: TValues,
): DesignTokenGroup<TType, TValues> {
	const group = { $type: type } as DesignTokenGroup<TType, TValues>;

	for (const key in values) {
		(group as Record<string, unknown>)[key] = {
			$value: values[key],
		};
	}

	return group;
}

export function tokenKeys<TGroup extends { $type: string }>(
	group: TGroup,
): Array<TokenName<TGroup>> {
	return (Object.keys(group) as Array<keyof TGroup>).filter(
		(key): key is TokenName<TGroup> => key !== '$type',
	);
}

export function dimensionToRemString(value: DimensionTokenValue, base: number = 16): string {
	return value.unit === 'rem' ? `${value.value}rem` : pxToRem(value.value, base);
}

export function dimensionToPxNumber(value: DimensionTokenValue, base: number = 16): number {
	return value.unit === 'px' ? value.value : value.value * base;
}

export function durationToString(value: DurationTokenValue): string {
	return `${value.value}${value.unit}`;
}

export function cubicBezierToString(value: CubicBezierTokenValue): string {
	return `cubic-bezier(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`;
}

function formatNumber(value: number): string {
	if (!Number.isFinite(value)) {
		throw new Error(`Invalid numeric color component: ${value}`);
	}

	const normalized = Object.is(value, -0) ? 0 : value;
	return `${normalized}`;
}

const functionLikeColorSpaces = new Set(['hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch']);

export function colorToCssString(value: ColorTokenValue): string {
	if (value.components.length === 0) {
		throw new Error(`Color token "${value.colorSpace}" has no components`);
	}

	const components = value.components.map((component) => formatNumber(component));
	const alphaSuffix =
		value.alpha === undefined || value.alpha === 1 ? '' : ` / ${formatNumber(value.alpha)}`;

	if (functionLikeColorSpaces.has(value.colorSpace)) {
		return `${value.colorSpace}(${components.join(' ')}${alphaSuffix})`;
	}

	return `color(${value.colorSpace} ${components.join(' ')}${alphaSuffix})`;
}

const breakpointValues = {
	xsmall: { unit: 'px', value: 0 },
	small: { unit: 'px', value: 640 },
	medium: { unit: 'px', value: 768 },
	large: { unit: 'px', value: 1024 },
	xlarge: { unit: 'px', value: 1280 },
	xxlarge: { unit: 'px', value: 1536 },
} as const satisfies Record<string, DimensionTokenValue>;

type Breakpoint = keyof typeof breakpointValues;

const minMediaQueries = Object.fromEntries(
	typedKeys(breakpointValues).map((breakpoint) => [
		breakpoint,
		`@media(width >= ${dimensionToRemString(breakpointValues[breakpoint])})`,
	]),
) as Record<Breakpoint, string>;

const borderRadiusValues = {
	none: { unit: 'px', value: 0 },
	small: { unit: 'px', value: 2 },
	medium: { unit: 'px', value: 4 },
	large: { unit: 'px', value: 8 },
	xlarge: { unit: 'px', value: 16 },
	full: { unit: 'px', value: 9999 },
} as const satisfies Record<string, DimensionTokenValue>;

const borderWidthValues = {
	thin: { unit: 'px', value: 1 },
	thick: { unit: 'px', value: 2 },
} as const satisfies Record<string, DimensionTokenValue>;

const boxShadowValues = {
	none: 'none',
	xsmall: '0px 1px 2px rgba(0, 0, 0, 0.2)',
	small: '0px 2px 4px rgba(0, 0, 0, 0.2)',
	medium: '0px 2px 8px rgba(0, 0, 0, 0.2)',
	large: '0px 4px 16px rgba(0, 0, 0, 0.2)',
	xlarge: '-8px 8px 32px rgba(0, 0, 0, 0.2)',
} as const;

const controlSizeValues = {
	small: { unit: 'px', value: 32 },
	medium: { unit: 'px', value: 40 },
} as const satisfies Record<string, DimensionTokenValue>;

const fontFamilyValues = {
	sans: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
	mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
} as const;

const fontSizeValues = {
	xxsmall: { unit: 'px', value: 10 },
	xsmall: { unit: 'px', value: 12 },
	small: { unit: 'px', value: 14 },
	standard: { unit: 'px', value: 16 },
	medium: { unit: 'px', value: 20 },
	large: { unit: 'px', value: 40 },
	xlarge: { unit: 'px', value: 48 },
	xxlarge: { unit: 'px', value: 55 },
	h1: { unit: 'px', value: 36 },
	h2: { unit: 'px', value: 28 },
	h3: { unit: 'px', value: 24 },
	h4: { unit: 'px', value: 20 },
	h5: { unit: 'px', value: 18 },
	h6: { unit: 'px', value: 16 },
} as const satisfies Record<string, DimensionTokenValue>;

const fontWeightValues = {
	regular: 400,
	medium: 500,
	bold: 700,
} as const;

const iconSizeValues = {
	xsmall: { unit: 'px', value: 16 },
	small: { unit: 'px', value: 20 },
	medium: { unit: 'px', value: 24 },
	large: { unit: 'px', value: 32 },
} as const satisfies Record<string, DimensionTokenValue>;

const lineHeightValues = {
	nospace: 1,
	tight: 1.25,
	loose: 1.5,
} as const;

const motionDurationValues = {
	quick: { unit: 'ms', value: 120 },
	fast: { unit: 'ms', value: 150 },
	slow: { unit: 's', value: 1.2 },
	slower: { unit: 's', value: 2 },
} as const satisfies Record<string, DurationTokenValue>;

const motionEasingValues = {
	emphasized: [0.42, 0, 0.58, 1],
	exit: [0, 0, 0.58, 1],
	linear: [0, 0, 1, 1],
	standard: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, CubicBezierTokenValue>;

const spaceValues = {
	none: { unit: 'px', value: 0 },
	xxsmall: { unit: 'px', value: 4 },
	xsmall: { unit: 'px', value: 8 },
	small: { unit: 'px', value: 12 },
	medium: { unit: 'px', value: 16 },
	large: { unit: 'px', value: 24 },
	xlarge: { unit: 'px', value: 32 },
	xxlarge: { unit: 'px', value: 40 },
} as const satisfies Record<string, DimensionTokenValue>;

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
