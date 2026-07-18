// Runtime re-export of the generated text recipe. The recipe definition lives
// in text.recipe.ts and is registered in panda.config.ts; variants added there
// flow through the generated types with no edit here.
import type { TextVariantProps } from '../../styled-system/recipes/text.mjs';
import { text as pandaText } from '../../styled-system/recipes/text.mjs';

// Codegen spells mixed boolean/number variant keys as string literals
// ("false" | "true" | "1" | ...). The recipe runtime interpolates values into
// class names, so the boolean/number spellings produce the same classes;
// widen lineClamp back to the pre-migration public shape.
type BooleanLineClampValues = { false: false; true: true };
type WidenNumericLineClampValue<Value> = Value extends `${infer Numeric extends number}`
	? Numeric
	: Value;
type WidenLineClampValue<Value> = Value extends keyof BooleanLineClampValues
	? BooleanLineClampValues[Value]
	: WidenNumericLineClampValue<Value>;

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
/** Text line-clamp variant values. */
export type TextLineClampVariant = WidenLineClampValue<NonNullable<TextVariantProps['lineClamp']>>;

/** Aggregate variant type for the `Text` recipe. */
export type TextVariants = Omit<TextVariantProps, 'lineClamp'> & {
	lineClamp?: TextLineClampVariant;
};

/** Class-name function for the `Text` recipe. */
export const text = pandaText as unknown as (variants?: TextVariants) => string;
