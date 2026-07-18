import type { IconSize } from '../types/icon-size.js';

export const iconSizeVariants = {
	large: { blockSize: 'iconSize.large', inlineSize: 'iconSize.large' },
	medium: { blockSize: 'iconSize.medium', inlineSize: 'iconSize.medium' },
	small: { blockSize: 'iconSize.small', inlineSize: 'iconSize.small' },
	xsmall: { blockSize: 'iconSize.xsmall', inlineSize: 'iconSize.xsmall' },
} satisfies Record<IconSize, object>;
