import { link as pandaLink } from '../../styled-system/recipes/link.mjs';
import type { LinkTone } from './link.recipe-contract.js';

/** Public variants for the Link recipe. */
export interface LinkVariants {
	isStandalone?: boolean;
	tone?: LinkTone;
}

/** Class-name function for the Link recipe. */
export const link: (variants?: LinkVariants) => string = pandaLink;
