import type { ComplexStyleRule } from '@vanilla-extract/css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { createPropertyVariants, createVariants } from '../style-helpers.js';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';
import type {
	FontFamilyToken,
	FontSizeToken,
	FontWeightToken,
	ForegroundColorToken,
	LineHeightToken,
} from '../tokens.js';
import { tokenKeys, tokens } from '../tokens.js';
import { getTypographyClass } from '../typography.js';

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

export type TextColor = ForegroundColorToken | 'inherit';
export type TextFontFamily = FontFamilyToken;
export type TextFontWeight = FontWeightToken | 'inherit';

const lineClampNone = {} satisfies ComplexStyleRule;
const lineClampSingleLine = {
	minInlineSize: 0,
	overflowX: 'clip',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
} satisfies ComplexStyleRule;
const lineClampMultiLine = (lines: number) =>
	({
		display: '-webkit-box',
		minInlineSize: 0,
		overflow: 'hidden',
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: lines,
	}) satisfies ComplexStyleRule;

const lineClampVariants = {
	none: lineClampNone,
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
		shouldDisableTrim: false,
		textDecoration: 'none',
		textTransform: 'none',
		lineClamp: 'none',
		variant: 'unset',
		isVisuallyHidden: false,
	},
	variants: {
		color: colorVariants,
		fontFamily: fontFamilyVariants,
		fontSize: fontSizeVariants,
		fontWeight: fontWeightVariants,
		lineHeight: lineHeightVariants,
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
	},
});

export type TextVariants = RecipeVariants<typeof text>;
