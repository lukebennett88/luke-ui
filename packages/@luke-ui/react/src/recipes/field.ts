import type { FieldVariantProps } from '../../styled-system/recipes/field.mjs';
import { field } from '../../styled-system/recipes/field.mjs';
import type { PlainVariants } from '../types/plain-variants.js';

export type FieldVariants = PlainVariants<FieldVariantProps>;
export type FieldLabelVariants = FieldVariants;
export type FieldMessageVariants = FieldVariants;

export function fieldRoot(variants: FieldVariants = {}): string {
	return field(variants).root;
}

export function fieldLabel(variants: FieldVariants = {}): string {
	return field(variants).label;
}

export function fieldMessage(variants: FieldVariants = {}): string {
	return field(variants).message;
}
