import { defineRecipe } from '@pandacss/dev';
import type { IconSize } from '../types/icon-size.js';

const iconSizeVariants = {
	large: { blockSize: 'iconSize.large', inlineSize: 'iconSize.large' },
	medium: { blockSize: 'iconSize.medium', inlineSize: 'iconSize.medium' },
	small: { blockSize: 'iconSize.small', inlineSize: 'iconSize.small' },
	xsmall: { blockSize: 'iconSize.xsmall', inlineSize: 'iconSize.xsmall' },
} satisfies Record<IconSize, object>;

export const iconRecipe = defineRecipe({
	className: 'icon',
	description: 'Shared size and layout styling for Icon.',
	base: { display: 'inline-flex', flexShrink: 0 },
	defaultVariants: { size: 'medium' },
	variants: {
		size: iconSizeVariants,
	},
});
