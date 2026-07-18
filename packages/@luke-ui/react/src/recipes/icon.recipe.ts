import { defineRecipe } from '@pandacss/dev';

export const iconRecipe = defineRecipe({
	className: 'icon',
	description: 'Shared size and layout styling for Icon.',
	base: { display: 'inline-flex', flexShrink: 0 },
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			large: { blockSize: 'iconSize.large', inlineSize: 'iconSize.large' },
			medium: { blockSize: 'iconSize.medium', inlineSize: 'iconSize.medium' },
			small: { blockSize: 'iconSize.small', inlineSize: 'iconSize.small' },
			xsmall: { blockSize: 'iconSize.xsmall', inlineSize: 'iconSize.xsmall' },
		},
	},
});
