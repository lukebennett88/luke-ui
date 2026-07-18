// Runtime re-export of the generated text recipe. The recipe definition
// lives in text.recipe.ts and is registered in panda.config.ts; variants
// added there flow through the generated types with no edit here.
import { text as pandaText } from '../../styled-system/recipes/text.mjs';
import type { TextVariantProps } from '../../styled-system/recipes/text.mjs';

/** Typography size steps. */
export type TextSize = NonNullable<TextVariantProps['size']>;
/** Semantic text colours. */
export type TextColor = NonNullable<TextVariantProps['color']>;
/** Semantic font-weight roles. */
export type TextFontWeight = NonNullable<TextVariantProps['fontWeight']>;
/** Logical text alignment values. */
export type TextAlign = NonNullable<TextVariantProps['textAlign']>;
/** Text wrapping values. */
export type TextWrap = NonNullable<TextVariantProps['textWrap']>;
/** Text decoration variant values. */
export type TextDecoration = NonNullable<TextVariantProps['textDecoration']>;
/** Text transform variant values. */
export type TextTransform = NonNullable<TextVariantProps['textTransform']>;
/** Numeric glyph variant values. */
export type TextFontVariantNumeric = NonNullable<TextVariantProps['fontVariantNumeric']>;

type WidenLineClampValue<Value> = Value extends 'true'
	? true
	: Value extends 'false'
		? false
		: Value extends `${infer Numeric extends number}`
			? Numeric
			: never;

/** Text line-clamp variant values. */
export type TextLineClampVariant = WidenLineClampValue<NonNullable<TextVariantProps['lineClamp']>>;

/** Aggregate variant type for the `Text` recipe. */
export type TextVariants = Omit<TextVariantProps, 'lineClamp'> & {
	lineClamp?: TextLineClampVariant;
};

/** Class-name function for the `Text` recipe. */
export function text(variants: TextVariants = {}): string {
	const { lineClamp, ...rest } = variants;

	return pandaText(lineClamp === undefined ? rest : { ...rest, lineClamp: `${lineClamp}` });
}
