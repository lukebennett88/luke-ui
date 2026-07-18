import { text as pandaText } from '../../styled-system/recipes/text.mjs';
import type {
	TextAlignValue,
	TextColorValue,
	TextDecorationValue,
	TextFontVariantNumericValue,
	TextFontWeightValue,
	TextLineClampValue,
	TextSizeValue,
	TextTransformValue,
	TextWrapValue,
} from './text.recipe-contract.js';

/** Typography size steps. */
export type TextSize = TextSizeValue;
/** Semantic text colours. */
export type TextColor = TextColorValue;
/** Semantic font-weight roles. */
export type TextFontWeight = TextFontWeightValue;
/** Logical text alignment values. */
export type TextAlign = TextAlignValue;
/** Text wrapping values. */
export type TextWrap = TextWrapValue;
/** Text decoration variant values. */
export type TextDecoration = TextDecorationValue;
/** Text transform variant values. */
export type TextTransform = TextTransformValue;
/** Numeric glyph variant values. */
export type TextFontVariantNumeric = TextFontVariantNumericValue;
/** Text line-clamp variant values. */
export type TextLineClampVariant = TextLineClampValue;

/** Aggregate variant type for the `Text` recipe. */
export interface TextVariants {
	color?: TextColor;
	fontVariantNumeric?: TextFontVariantNumeric;
	fontWeight?: TextFontWeight;
	isVisuallyHidden?: boolean;
	lineClamp?: TextLineClampVariant;
	shouldDisableTrim?: boolean;
	shouldInheritFont?: boolean;
	size?: TextSize;
	textAlign?: TextAlign;
	textDecoration?: TextDecoration;
	textTransform?: TextTransform;
	textWrap?: TextWrap;
}

/** Class-name function for the `Text` recipe. */
export function text(variants: TextVariants = {}): string {
	const { lineClamp, ...restVariants } = variants;

	return pandaText({ ...restVariants, lineClamp: resolveLineClamp(lineClamp) });
}

function resolveLineClamp(lineClamp: TextLineClampVariant | undefined) {
	switch (lineClamp) {
		case undefined:
			return undefined;
		case false:
			return 'false';
		case true:
			return 'true';
		case 1:
			return '1';
		case 2:
			return '2';
		case 3:
			return '3';
		case 4:
			return '4';
		case 5:
			return '5';
	}
}
