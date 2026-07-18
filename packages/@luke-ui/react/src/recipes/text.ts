import { text as pandaText } from '../../styled-system/recipes/text.mjs';
import { textLineClampKeys } from './text.recipe-contract.js';
import type {
	TextAlign,
	TextColor,
	TextDecoration,
	TextFontVariantNumeric,
	TextFontWeight,
	TextLineClampVariant,
	TextSize,
	TextTransform,
	TextWrap,
} from './text.recipe-contract.js';

export type {
	TextAlign,
	TextColor,
	TextDecoration,
	TextFontVariantNumeric,
	TextFontWeight,
	TextLineClampVariant,
	TextSize,
	TextTransform,
	TextWrap,
};

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
	return lineClamp === undefined ? undefined : textLineClampKeys.get(lineClamp);
}
