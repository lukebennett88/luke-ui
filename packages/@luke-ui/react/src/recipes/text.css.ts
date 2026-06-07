import fontMetrics from '@capsizecss/metrics/appleSystem';
import { createTextStyle } from '@capsizecss/vanilla-extract';
import type { ComplexStyleRule } from '@vanilla-extract/css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';
import { dimensionToPxNumber } from '../tokens/converters.js';
import { tokenKeys } from '../tokens/groups.js';
import type {
	FontFamilyToken,
	FontSizeToken,
	FontWeightToken,
	ForegroundColorToken,
	LineHeightToken,
} from '../tokens/index.js';
import { tokens } from '../tokens/index.js';

type StylePrimitive = string | number;

function createVariants<Key extends string, Style extends Record<string, StylePrimitive>>(
	keys: ReadonlyArray<Key>,
	getStyle: (key: Key) => Style,
): Record<Key, Style> {
	const styles = {} as Record<Key, Style>;
	for (const key of keys) {
		styles[key] = getStyle(key);
	}
	return styles;
}

function createPropertyVariants<Key extends string, Property extends string>(
	keys: ReadonlyArray<Key>,
	property: Property,
	values: Record<Key, string>,
): Record<Key, Record<Property, string>> {
	return createVariants(keys, (key) => ({
		[property]: values[key],
	})) as Record<Key, Record<Property, string>>;
}

interface GetTypographyInput {
	fontSize: FontSizeToken;
	lineHeight: LineHeightToken;
}

function getTypographyClass(input: GetTypographyInput, debugId?: string) {
	const fontSize = dimensionToPxNumber(tokens.fontSize[input.fontSize].$value);
	const lineHeight = tokens.lineHeight[input.lineHeight].$value;

	return createTextStyle(
		{
			fontMetrics,
			fontSize,
			leading: fontSize * lineHeight,
		},
		debugId,
	);
}

const colorKeys = tokenKeys(tokens.foregroundColor);
const fontFamilyKeys = tokenKeys(tokens.fontFamily);
const fontSizeKeys = tokenKeys(tokens.fontSize);
const fontWeightKeys = tokenKeys(tokens.fontWeight);
const lineHeightKeys = tokenKeys(tokens.lineHeight);

const textDecorationKeys = ['none', 'underline', 'line-through', 'inherit'] as const;
export type TextDecoration = (typeof textDecorationKeys)[number];

const textTransformKeys = ['none', 'capitalize', 'uppercase', 'lowercase', 'inherit'] as const;
export type TextTransform = (typeof textTransformKeys)[number];

const textAlignKeys = ['start', 'center', 'end'] as const;
export type TextAlign = (typeof textAlignKeys)[number];

const textVariantKeys = [
	'unset',
	'diagonal-fractions',
	'ordinal',
	'slashed-zero',
	'tabular-nums',
] as const;
export type TextVariant = (typeof textVariantKeys)[number];

const textWrapKeys = ['unset', 'balance', 'pretty'] as const;
export type TextWrap = (typeof textWrapKeys)[number];

export type TextColor = ForegroundColorToken | 'inherit';
export type TextFontFamily = FontFamilyToken;
export type TextFontWeight = FontWeightToken | 'inherit';

const lineClampNone = {} satisfies ComplexStyleRule;
const lineClampSingleLine = {
	display: 'block',
	minInlineSize: 0,
	overflowX: 'clip',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
} satisfies ComplexStyleRule;
const lineClampMultiLine = (lines: number) =>
	({
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: lines,
		display: '-webkit-box',
		lineClamp: lines,
		minInlineSize: 0,
		overflow: 'hidden',
	}) satisfies ComplexStyleRule;

const lineClampVariants = {
	false: lineClampNone,
	true: lineClampSingleLine,
	1: lineClampSingleLine,
	2: lineClampMultiLine(2),
	3: lineClampMultiLine(3),
	4: lineClampMultiLine(4),
	5: lineClampMultiLine(5),
} as const;

export type TextLineClampVariant = keyof typeof lineClampVariants;

const base = styleInLayer('recipes', {
	color: vars.color.neutralBold,
	fontFamily: vars.fontFamily.sans,
	minInlineSize: 0,
	overflowWrap: 'break-word',
});

const colorVariants: Record<TextColor, { color: TextColor }> = (() => {
	const variants = createPropertyVariants(colorKeys, 'color', vars.color) as Record<
		TextColor,
		{ color: TextColor }
	>;
	variants.inherit = { color: 'inherit' };
	return variants;
})();

const fontFamilyVariants = createPropertyVariants(
	fontFamilyKeys,
	'fontFamily',
	vars.fontFamily,
) as Record<TextFontFamily, { fontFamily: TextFontFamily }>;

const fontWeightVariants: Record<TextFontWeight, { fontWeight: TextFontWeight }> = (() => {
	const variants = createPropertyVariants(fontWeightKeys, 'fontWeight', vars.fontWeight) as Record<
		TextFontWeight,
		{ fontWeight: TextFontWeight }
	>;
	variants.inherit = { fontWeight: 'inherit' };
	return variants;
})();

const textDecorationVariants = createVariants(textDecorationKeys, (textDecoration) => ({
	textDecoration,
}));

const textTransformVariants = createVariants(textTransformKeys, (textTransform) => ({
	textTransform,
}));

const textAlignVariants = {
	start: { textAlign: 'start' },
	center: { textAlign: 'center' },
	end: { textAlign: 'end' },
} as const;

const textVariantVariants = createVariants(textVariantKeys, (variant) => ({
	fontVariantNumeric: variant === 'unset' ? 'normal' : variant,
}));

const textWrapVariants = createVariants(textWrapKeys, (textWrap) => ({
	textWrap: textWrap === 'unset' ? 'wrap' : textWrap,
}));

const fontSizeVariants = Object.fromEntries(fontSizeKeys.map((key) => [key, {}])) as Record<
	FontSizeToken,
	{}
>;

const lineHeightVariants = Object.fromEntries(lineHeightKeys.map((key) => [key, {}])) as Record<
	LineHeightToken,
	{}
>;

const typographyCompoundVariants = (() => {
	const variants: Array<{
		variants: {
			fontSize: FontSizeToken;
			lineHeight: LineHeightToken;
			shouldDisableTrim: boolean;
		};
		style:
			| string
			| {
					fontSize: string;
					lineHeight: string;
			  };
	}> = [];

	for (const fontSize of fontSizeKeys) {
		for (const lineHeight of lineHeightKeys) {
			variants.push({
				style: getTypographyClass(
					{ fontSize, lineHeight },
					`text_typography_${fontSize}_${lineHeight}`,
				),
				variants: {
					fontSize,
					lineHeight,
					shouldDisableTrim: false,
				},
			});

			variants.push({
				style: {
					fontSize: vars.fontSize[fontSize],
					lineHeight: vars.lineHeight[lineHeight],
				},
				variants: {
					fontSize,
					lineHeight,
					shouldDisableTrim: true,
				},
			});
		}
	}

	return variants;
})();

export const text = recipeInLayer('recipes', {
	base,
	compoundVariants: typographyCompoundVariants,
	defaultVariants: {
		textAlign: 'start',
		color: 'neutralBold',
		fontFamily: 'sans',
		fontSize: 'standard',
		fontWeight: 'regular',
		lineHeight: 'loose',
		shouldInheritFont: false,
		shouldDisableTrim: false,
		textDecoration: 'none',
		textTransform: 'none',
		lineClamp: false,
		variant: 'unset',
		isVisuallyHidden: false,
		textWrap: 'unset',
	},
	variants: {
		color: colorVariants,
		fontFamily: fontFamilyVariants,
		fontSize: fontSizeVariants,
		fontWeight: fontWeightVariants,
		lineHeight: lineHeightVariants,
		shouldInheritFont: {
			false: {},
			true: {
				font: 'inherit',
			},
		},
		shouldDisableTrim: {
			false: {},
			true: {},
		},
		lineClamp: lineClampVariants,
		textAlign: textAlignVariants,
		textDecoration: textDecorationVariants,
		textTransform: textTransformVariants,
		variant: textVariantVariants,
		isVisuallyHidden: {
			false: {},
			true: {
				position: 'absolute',
				transform: 'scale(0)',
			},
		},
		textWrap: textWrapVariants,
	},
});

export type TextVariants = RecipeVariants<typeof text>;
