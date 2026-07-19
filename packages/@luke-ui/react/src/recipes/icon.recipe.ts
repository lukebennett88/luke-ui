import { defineRecipe } from '@pandacss/dev';
import type { IconSize, IconSizeToken } from '../types/token-unions.js';

const iconSizeVariants = {
	large: { blockSize: 'iconSize.large', inlineSize: 'iconSize.large' },
	medium: { blockSize: 'iconSize.medium', inlineSize: 'iconSize.medium' },
	small: { blockSize: 'iconSize.small', inlineSize: 'iconSize.small' },
	xsmall: { blockSize: 'iconSize.xsmall', inlineSize: 'iconSize.xsmall' },
} as const satisfies {
	[Size in IconSize]: { blockSize: IconSizeToken<Size>; inlineSize: IconSizeToken<Size> };
};

export const iconRecipe = defineRecipe({
	className: 'icon',
	description: 'Shared size and layout styling for Icon.',
	base: { display: 'inline-flex', flexShrink: 0 },
	defaultVariants: { size: 'medium' },
	variants: {
		size: iconSizeVariants,
	},
});
