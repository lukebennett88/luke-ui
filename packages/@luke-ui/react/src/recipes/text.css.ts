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
/** Text decoration variant values. */
export type TextDecoration = (typeof textDecorationKeys)[number];

const textTransformKeys = ['none', 'capitalize', 'uppercase', 'lowercase', 'inherit'] as const;
/** Text transform variant values. */
export type TextTransform = (typeof textTransformKeys)[number];

const textAlignKeys = ['start', 'center', 'end'] as const;
/** Text alignment variant values. */
export type TextAlign = (typeof textAlignKeys)[number];

const fontVariantNumericKeys = [
	'unset',
	'diagonal-fractions',
	'ordinal',
	'slashed-zero',
	'tabular-nums',
] as const;
/** Numeric glyph variant values. */
export type TextFontVariantNumeric = (typeof fontVariantNumericKeys)[number];

const textWrapKeys = ['unset', 'balance', 'pretty'] as const;
/** Text wrap variant values. */
export type TextWrap = (typeof textWrapKeys)[number];

/** Text color variant values. */
export type TextColor = ForegroundColorToken | 'inherit';
/** Text font-family variant values. */
export type TextFontFamily = FontFamilyToken;
/** Text font-weight variant values. */
export type TextFontWeight = FontWeightToken | 'inherit';

const lineClampNone = {} satisfies ComplexStyleRule;
const lineClampSingleLine = {
	display: 'block',
	minInlineSize: 0,
	overflowX: 'clip',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
} satisfies ComplexStyleRule;
const lineClampMultiLine = (lines: number) => {
	return {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: lines,
		display: '-webkit-box',
		lineClamp: lines,
		minInlineSize: 0,
		overflow: 'hidden',
	} satisfies ComplexStyleRule;
};

const lineClampVariants = {
	false: lineClampNone,
	true: lineClampSingleLine,
	1: lineClampSingleLine,
	2: lineClampMultiLine(2),
	3: lineClampMultiLine(3),
	4: lineClampMultiLine(4),
	5: lineClampMultiLine(5),
} as const;

/** Text line-clamp variant values. */
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

const fontVariantNumericVariants = createVariants(fontVariantNumericKeys, (fontVariantNumeric) => ({
	fontVariantNumeric: fontVariantNumeric === 'unset' ? 'normal' : fontVariantNumeric,
}));

const textWrapVariants = {
	balance: { textWrap: 'balance' },
	pretty: { textWrap: 'pretty' },
	unset: {},
} as const;

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

/** Vanilla-extract recipe for the `Text` primitive's styles. */
export const text = recipeInLayer('recipes', {
	base,
	compoundVariants: typographyCompoundVariants,
	defaultVariants: {
		color: 'neutralBold',
		fontFamily: 'sans',
		fontSize: 'standard',
		fontWeight: 'regular',
		isVisuallyHidden: false,
		lineClamp: false,
		lineHeight: 'loose',
		shouldDisableTrim: false,
		shouldInheritFont: false,
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'none',
		textWrap: 'unset',
		fontVariantNumeric: 'unset',
	},
	variants: {
		color: colorVariants,
		fontFamily: fontFamilyVariants,
		fontSize: fontSizeVariants,
		fontVariantNumeric: fontVariantNumericVariants,
		fontWeight: fontWeightVariants,
		isVisuallyHidden: {
			false: {},
			true: {
				position: 'absolute',
				transform: 'scale(0)',
			},
		},
		lineClamp: lineClampVariants,
		lineHeight: lineHeightVariants,
		shouldDisableTrim: {
			false: {},
			true: {},
		},
		shouldInheritFont: {
			false: {},
			true: {
				font: 'inherit',
			},
		},
		textAlign: textAlignVariants,
		textDecoration: textDecorationVariants,
		textTransform: textTransformVariants,
		textWrap: textWrapVariants,
	},
});

/** Aggregate variant type for the `Text` recipe. */
export type TextVariants = RecipeVariants<typeof text>;
