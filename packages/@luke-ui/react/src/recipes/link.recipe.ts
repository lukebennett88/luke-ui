import { defineRecipe } from '@pandacss/dev';
import { focusRing } from '../styles/focus-ring.js';

const linkToneVariants = {
	accent: {
		color: 'intent.accent.text',
		'&[data-hovered="true"]:not([data-disabled="true"])': {
			color: 'intent.accent.textHover',
		},
		'&[data-pressed="true"]:not([data-disabled="true"])': {
			color: 'intent.accent.textHover',
		},
	},
	neutral: {
		color: 'text.secondary',
		'&[data-hovered="true"]:not([data-disabled="true"])': { color: 'text.primary' },
		'&[data-pressed="true"]:not([data-disabled="true"])': { color: 'text.primary' },
	},
};

export type LinkTone = keyof typeof linkToneVariants;

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
		'&[data-focus-visible="true"]': focusRing('border.focus'),
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
