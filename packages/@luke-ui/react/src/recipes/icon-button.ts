import type { IconButtonVariantProps } from '../../styled-system/recipes/icon-button.mjs';
import { iconButton } from '../../styled-system/recipes/icon-button.mjs';
import type { PlainVariants } from '../types/plain-variants.js';

export type IconButtonVariants = PlainVariants<IconButtonVariantProps>;

export function iconButtonRoot(variants: IconButtonVariants = {}): string {
	return iconButton(variants).root;
}

export function iconButtonIcon(variants: IconButtonVariants = {}): string {
	return iconButton(variants).icon;
}
