import { focusRing, restingFocusRing } from '../styles/focus-ring.js';
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
	color: vars.color.foreground.accent.rest,
	cursor: 'pointer',
	font: 'inherit',
	...restingFocusRing(),
	textDecoration: 'underline',
	textDecorationColor: 'currentColor',
	transitionDuration: vars.motion.duration.fast,
	transitionProperty: 'color, text-decoration-color',
	transitionTimingFunction: vars.motion.easing.standard,
	selectors: {
		'&[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: vars.interaction.disabledOpacity,
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
				minBlockSize: vars.controlSize.minTarget,
				minInlineSize: vars.controlSize.minTarget,
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
				color: vars.color.foreground.accent.rest,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						color: vars.color.foreground.accent.hover,
					},
					// Press reuses the hover foreground: the shared contract carries no separate pressed
					// content colour, so the stronger hover value covers both interactive states.
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						color: vars.color.foreground.accent.hover,
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
