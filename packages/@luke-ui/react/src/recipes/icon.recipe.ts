import { defineRecipe } from '@pandacss/dev';
import { iconSizeVariants } from './icon.recipe-contract.js';

export const iconRecipe = defineRecipe({
	className: 'icon',
	description: 'Shared size and layout styling for Icon.',
	base: { display: 'inline-flex', flexShrink: 0 },
	defaultVariants: { size: 'medium' },
	variants: {
		size: iconSizeVariants,
	},
});
