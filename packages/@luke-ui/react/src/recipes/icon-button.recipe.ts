import { defineSlotRecipe } from '@pandacss/dev';
import type { ControlSize } from '../types/token-unions.js';

const iconButtonSizes = {
	medium: { root: { inlineSize: 'controlSize.medium' } },
	small: { root: { inlineSize: 'controlSize.small' } },
} as const satisfies Record<ControlSize, { root: { inlineSize: `controlSize.${ControlSize}` } }>;

export const iconButtonRecipe = defineSlotRecipe({
	className: 'icon-button',
	description: 'Icon-only Button composition and pending state.',
	slots: ['root', 'icon'],
	base: {
		root: {
			'@media (forced-colors: active)': {
				'&[data-pending="true"]::after': {
					borderColor: 'ButtonText',
					borderInlineEndColor: 'transparent',
				},
			},
			paddingInline: 0,
			'&[data-pending="true"]::after': {
				borderColor: 'border.focus',
				borderInlineEndColor: 'transparent',
				borderRadius: 'full',
				borderStyle: 'solid',
				borderWidth: '2px',
				blockSize: 'iconSize.xsmall',
				content: '""',
				inlineSize: 'iconSize.xsmall',
				position: 'absolute',
			},
		},
		icon: {},
	},
	defaultVariants: { isPending: false, size: 'medium' },
	variants: {
		isPending: { false: {}, true: { icon: { opacity: 0 } } },
		size: iconButtonSizes,
	},
});
