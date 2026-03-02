import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

const base = styleInLayer('recipes', {
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
	textDecoration: 'none',
	transition:
		'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events',
	transitionTimingFunction: vars.motion.easing.standard,
	transitionDuration: vars.motion.duration.fast,
	whiteSpace: 'nowrap',

	selectors: {
		'&:enabled:active': {
			scale: 0.98,
		},
		'&:disabled': {
			backgroundColor: vars.backgroundColor.disabled,
			borderColor: vars.borderColor.neutralDisabled,
			color: vars.foregroundColor.disabled,
		},
	},
});

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
			small: {
				fontSize: vars.font.size.small,
				blockSize: vars.controlSize.small,
				paddingInline: vars.space.small,
			},
			medium: {
				fontSize: vars.font.size.standard,
				blockSize: vars.controlSize.medium,
				paddingInline: vars.space.medium,
			},
		},
		tone: {
			primary: {
				backgroundColor: vars.themeColor.buttonBackgroundColor,
				borderColor: vars.themeColor.buttonBorderColor,
				color: vars.themeColor.buttonColor,
				selectors: {
					'&:enabled:hover': {
						backgroundColor: vars.themeColor.buttonBackgroundColorHover,
						borderColor: vars.themeColor.buttonBorderColorHover,
					},
					'&:enabled:active': {
						backgroundColor: vars.themeColor.buttonBackgroundColorActive,
						borderColor: vars.themeColor.buttonBorderColorActive,
					},
				},
			},
			critical: {
				backgroundColor: vars.backgroundColor.criticalBold,
				borderColor: vars.backgroundColor.criticalBold,
				color: vars.themeColor.buttonColor,
				selectors: {
					'&:enabled:hover': {
						backgroundColor: vars.backgroundColor.criticalBoldHover,
						borderColor: vars.backgroundColor.criticalBoldHover,
					},
					'&:enabled:active': {
						backgroundColor: vars.backgroundColor.criticalBoldPressed,
						borderColor: vars.backgroundColor.criticalBoldPressed,
					},
				},
			},
			ghost: {
				backgroundColor: 'transparent',
				borderColor: 'transparent',
				color: vars.foregroundColor.neutralBold,
				selectors: {
					'&:enabled:hover': {
						backgroundColor: vars.backgroundColor.neutralHover,
						borderColor: vars.backgroundColor.neutralHover,
					},
					'&:enabled:active': {
						backgroundColor: vars.backgroundColor.neutralPressed,
						borderColor: vars.backgroundColor.neutralPressed,
					},
				},
			},
			neutral: {
				backgroundColor: vars.backgroundColor.default,
				borderColor: vars.border.default,
				color: vars.foregroundColor.primary,
				selectors: {
					'&:enabled:hover': {
						backgroundColor: vars.backgroundColor.hover,
					},
					'&:enabled:active': {
						backgroundColor: vars.backgroundColor.pressed,
					},
				},
			},
		},
	},
});

export type ButtonVariants = RecipeVariants<typeof button>;
