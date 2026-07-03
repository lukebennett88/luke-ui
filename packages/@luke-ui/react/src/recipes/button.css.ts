import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

const base = styleInLayer('recipes', {
	'@media': {
		'(forced-colors: active)': {
			borderColor: 'ButtonText',
			selectors: {
				'&:disabled': {
					borderColor: 'GrayText',
					color: 'GrayText',
				},
				'&:enabled:hover': {
					backgroundColor: 'Highlight',
					borderColor: 'Highlight',
					color: 'HighlightText',
				},
			},
		},
	},
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.backgroundColor.default,
	borderColor: vars.border.default,
	borderRadius: vars.borderRadius.medium,
	borderStyle: 'solid',
	borderWidth: vars.borderWidth.thin,
	display: 'inline-flex',
	fontFamily: vars.font.family.body,
	fontWeight: vars.font.weight.medium,
	gap: vars.space.xsmall,
	justifyContent: 'center',
	lineHeight: vars.font.lineHeight.nospace,
	minInlineSize: 0,

	selectors: {
		'&:disabled': {
			backgroundColor: vars.backgroundColor.disabled,
			borderColor: vars.backgroundColor.disabled,
			color: vars.foregroundColor.disabled,
		},
		'&:enabled:active': {
			scale: 0.98,
		},
	},
	textDecoration: 'none',
	transition:
		'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events',
	transitionDuration: vars.motion.duration.fast,
	transitionTimingFunction: vars.motion.easing.standard,
	whiteSpace: 'nowrap',
});

/** Vanilla-extract recipe for the `Button` primitive's button styles. */
export const button = recipeInLayer('recipes', {
	base,
	defaultVariants: {
		isBlock: false,
		size: 'medium',
		tone: 'primary',
	},
	variants: {
		isBlock: {
			false: {},
			true: {
				inlineSize: '100%',
			},
		},
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				fontSize: vars.font.size.standard,
				paddingInline: vars.space.medium,
			},
			small: {
				blockSize: vars.controlSize.small,
				fontSize: vars.font.size.small,
				paddingInline: vars.space.small,
			},
		},
		tone: {
			critical: {
				backgroundColor: vars.backgroundColor.criticalBold,
				borderColor: vars.backgroundColor.criticalBold,
				color: vars.themeColor.buttonColor,
				selectors: {
					'&:enabled:active': {
						backgroundColor: vars.backgroundColor.criticalBoldPressed,
						borderColor: vars.backgroundColor.criticalBoldPressed,
					},
					'&:enabled:hover': {
						backgroundColor: vars.backgroundColor.criticalBoldHover,
						borderColor: vars.backgroundColor.criticalBoldHover,
					},
				},
			},
			ghost: {
				backgroundColor: 'transparent',
				borderColor: 'transparent',
				color: vars.foregroundColor.neutralBold,
				selectors: {
					'&:enabled:active': {
						backgroundColor: vars.backgroundColor.neutralPressed,
						borderColor: vars.backgroundColor.neutralPressed,
					},
					'&:enabled:hover': {
						backgroundColor: vars.backgroundColor.neutralHover,
						borderColor: vars.backgroundColor.neutralHover,
					},
				},
			},
			neutral: {
				backgroundColor: vars.backgroundColor.default,
				borderColor: vars.border.default,
				color: vars.foregroundColor.primary,
				selectors: {
					'&:enabled:active': {
						backgroundColor: vars.backgroundColor.pressed,
					},
					'&:enabled:hover': {
						backgroundColor: vars.backgroundColor.hover,
					},
				},
			},
			primary: {
				backgroundColor: vars.themeColor.buttonBackgroundColor,
				borderColor: vars.themeColor.buttonBorderColor,
				color: vars.themeColor.buttonColor,
				selectors: {
					'&:enabled:active': {
						backgroundColor: vars.themeColor.buttonBackgroundColorActive,
						borderColor: vars.themeColor.buttonBorderColorActive,
					},
					'&:enabled:hover': {
						backgroundColor: vars.themeColor.buttonBackgroundColorHover,
						borderColor: vars.themeColor.buttonBorderColorHover,
					},
				},
			},
		},
	},
});

/** Variant type for the `Button` recipe. */
export type ButtonVariants = RecipeVariants<typeof button>;
