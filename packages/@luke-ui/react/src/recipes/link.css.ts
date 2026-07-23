import { focusRing } from '../styles/focus-ring.js';
import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';

const base = styleInLayer('recipes', {
	'@media': {
		'(forced-colors: active)': {
			color: 'LinkText',
			forcedColorAdjust: 'auto',
			selectors: {
				'&[data-disabled="true"]': {
					color: 'GrayText',
					opacity: 1,
				},
				'&[data-focus-visible="true"]': {
					outlineColor: 'Highlight',
				},
			},
		},
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
	color: vars.color.intent.accent.text,
	cursor: 'pointer',
	font: 'inherit',
	outlineColor: 'transparent',
	outlineOffset: '2px',
	outlineStyle: 'solid',
	outlineWidth: '2px',
	textDecoration: 'underline',
	textDecorationColor: 'currentColor',
	transitionDuration: vars.motion.duration.fast,
	transitionProperty: 'color, text-decoration-color',
	transitionTimingFunction: vars.motion.easing.standard,
	selectors: {
		'&[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: 0.55,
		},
		'&[data-focus-visible="true"]': {
			...focusRing(vars.color.border.focus),
		},
	},
});

/** Vanilla-extract recipe for the `Link` primitive's styles. */
export const link = recipe({
	base,
	defaultVariants: {
		isStandalone: false,
		tone: 'accent',
	},
	variants: {
		isStandalone: {
			false: {},
			true: {
				alignItems: 'center',
				display: 'inline-flex',
				minBlockSize: '24px',
				minInlineSize: '24px',
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						textDecoration: 'underline',
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						textDecoration: 'underline',
					},
				},
				textDecoration: 'none',
			},
		},
		tone: {
			accent: {
				color: vars.color.intent.accent.text,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						color: vars.color.intent.accent.textHover,
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						color: vars.color.intent.accent.textHover,
					},
				},
			},
			neutral: {
				color: vars.color.text.secondary,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						color: vars.color.text.primary,
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						color: vars.color.text.primary,
					},
				},
			},
		},
	},
});

/** Variant type for the `Link` recipe. */
export type LinkVariants = RecipeSelection<typeof link>;
