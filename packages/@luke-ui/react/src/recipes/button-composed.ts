import type { ButtonComposedVariantProps } from '../../styled-system/recipes/button-composed.mjs';
import { buttonComposed } from '../../styled-system/recipes/button-composed.mjs';
import type { PlainVariants } from '../types/plain-variants.js';

export type ButtonComposedVariants = PlainVariants<ButtonComposedVariantProps>;
export type ButtonLabelVariants = ButtonComposedVariants;

export function buttonContent(variants: ButtonComposedVariants = {}): string {
	return buttonComposed(variants).content;
}

export function buttonLabel(variants: ButtonComposedVariants = {}): string {
	return buttonComposed(variants).label;
}

export function spinnerOverlay(variants: ButtonComposedVariants = {}): string {
	return buttonComposed(variants).spinnerOverlay;
}
