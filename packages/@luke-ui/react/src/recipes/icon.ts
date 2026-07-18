import { icon as pandaIcon } from '../../styled-system/recipes/icon.mjs';
import type { IconSize } from './icon.recipe-contract.js';

/** Public variants for the Icon recipe. */
export interface IconVariants {
	size?: IconSize;
}

/** Class-name function for the Icon recipe. */
export const icon: (variants?: IconVariants) => string = pandaIcon;
