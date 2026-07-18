import { textInput } from '../../styled-system/recipes/text-input.mjs';
import type { TextInputSizeValue } from './text-input.recipe-contract.js';

/** Public variants for the TextInput recipe. */
export interface TextInputVariants {
	size?: TextInputSizeValue;
}

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
