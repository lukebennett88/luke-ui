import type { LoadingSpinnerVariantProps } from '../../styled-system/recipes/loading-spinner.mjs';
import { loadingSpinner } from '../../styled-system/recipes/loading-spinner.mjs';
import type { PlainVariants } from '../types/plain-variants.js';

export type LoadingSpinnerVariants = PlainVariants<LoadingSpinnerVariantProps>;
export const spinAnimationName = 'spin';
export const rubberBandAnimationName = 'rubberBand';

export function spinner(variants: LoadingSpinnerVariants = {}): string {
	return loadingSpinner(variants).root;
}

export function spinnerState(variants: LoadingSpinnerVariants = {}): string {
	return loadingSpinner(variants).state;
}

export function svg(variants: LoadingSpinnerVariants = {}): string {
	return loadingSpinner(variants).svg;
}

export function indicator(variants: LoadingSpinnerVariants = {}): string {
	return loadingSpinner(variants).indicator;
}
