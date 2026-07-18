import { defineRecipe } from '@pandacss/dev';
import type { ColorToken } from '../../styled-system/tokens/index.mjs';
import type { SystemStyleObject } from '../../styled-system/types/system-types.d.mts';
import { focusRing } from '../styles/focus-ring.js';

const linkToneVariants = {
	accent: toneVariant('intent.accent.text', 'intent.accent.textHover'),
	neutral: toneVariant('text.secondary', 'text.primary'),
};

export const linkRecipe = defineRecipe({
	className: 'link',
	description: 'Semantic navigation styling for Link.',
	base: {
		'@media (forced-colors: active)': {
			color: 'LinkText',
			forcedColorAdjust: 'auto',
			'&[data-disabled="true"]': { color: 'GrayText', opacity: 1 },
			'&[data-focus-visible="true"]': { outlineColor: 'Highlight' },
		},
		'@media (prefers-reduced-motion: reduce)': { transition: 'none' },
		color: 'intent.accent.text',
		cursor: 'pointer',
		font: 'inherit',
		outlineColor: 'transparent',
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		textDecoration: 'underline',
		textDecorationColor: 'currentColor',
		transitionDuration: 'fast',
		transitionProperty: 'color, text-decoration-color',
		transitionTimingFunction: 'standard',
		'&[data-disabled="true"]': { cursor: 'not-allowed', opacity: 0.55 },
		'&[data-focus-visible="true"]': focusRing('border.focus' satisfies ColorToken),
	},
	defaultVariants: { isStandalone: false, tone: 'accent' },
	variants: {
		isStandalone: {
			false: {},
			true: {
				alignItems: 'center',
				display: 'inline-flex',
				minBlockSize: '24px',
				minInlineSize: '24px',
				textDecoration: 'none',
				'&[data-hovered="true"]:not([data-disabled="true"])': {
					textDecoration: 'underline',
				},
				'&[data-pressed="true"]:not([data-disabled="true"])': {
					textDecoration: 'underline',
				},
			},
		},
		tone: linkToneVariants,
	},
});

function toneVariant(resting: ColorToken, interaction: ColorToken) {
	return {
		color: resting,
		'&[data-hovered="true"]:not([data-disabled="true"])': { color: interaction },
		'&[data-pressed="true"]:not([data-disabled="true"])': { color: interaction },
	} as const satisfies SystemStyleObject;
}
