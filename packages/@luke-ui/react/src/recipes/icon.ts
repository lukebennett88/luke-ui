import { icon as pandaIcon } from '../../styled-system/recipes/icon.mjs';
import type { IconSize } from './icon.recipe.js';

/** Public variants for the Icon recipe. */
export interface IconVariants {
	size?: IconSize;
}

/** Class-name function for the Icon recipe. */
export function icon(variants?: IconVariants): string {
	return pandaIcon(variants);
}
