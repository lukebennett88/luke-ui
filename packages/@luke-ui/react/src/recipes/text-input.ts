// Runtime re-export of the generated text-input slot recipe. The recipe
// definition lives in text-input.recipe.ts and is registered in
// panda.config.ts; variants added there flow through the generated types with
// no edit here.
import type { TextInputVariantProps } from '../../styled-system/recipes/text-input.mjs';
import { textInput } from '../../styled-system/recipes/text-input.mjs';
import type { PlainVariants } from '../types/plain-variants.js';

// See PlainVariants for why the generated variant props need unwrapping.
export type TextInputVariants = PlainVariants<TextInputVariantProps>;

// Per-slot class-name helpers: the generated function returns one classes-per-
// slot record, but the public API (and TextInput itself) consumes one slot at
// a time.
export function textInputGroup(variants: TextInputVariants = {}): string {
	return textInput(variants).group;
}

export function textInputControl(variants: TextInputVariants = {}): string {
	return textInput(variants).control;
}

export function textInputAdornmentStart(variants: TextInputVariants = {}): string {
	return textInput(variants).adornmentStart;
}

export function textInputAdornmentEnd(variants: TextInputVariants = {}): string {
	return textInput(variants).adornmentEnd;
}
