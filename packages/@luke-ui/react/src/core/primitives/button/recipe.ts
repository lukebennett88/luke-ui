import { fontMetrics } from '../../../theme/font-metric-scale.stylex.js';
import { vars } from '../../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../../styles/recipe-authoring.js';
import { recipe } from '../../styles/recipe-authoring.js';

/** Semantic appearance and material recipe shared by Button and IconButton. */
export const buttonRecipe = recipe({
	base: {
		alignItems: 'center',
		appearance: 'none',
		borderColor: 'transparent',
		borderRadius: vars.radius.control,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depth.resting,
		boxSizing: 'border-box',
		cursor: 'default',
		display: 'inline-flex',
		fontFamily: vars.font.family.body,
		fontWeight: vars.font.weight.label,
		isolation: 'isolate',
		justifyContent: 'center',
		letterSpacing: fontMetrics.step14.letterSpacing,
		lineHeight: fontMetrics.step14.lineHeight,
		minBlockSize: vars.controlSize.minTarget,
		minInlineSize: vars.controlSize.minTarget,
		position: 'relative',
		textDecoration: 'none',
		transform: 'translateY(0)',
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty: 'background-color, border-color, box-shadow, color, opacity, transform',
		transitionTimingFunction: vars.motion.easing.standard,
		whiteSpace: 'nowrap',
		'[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: vars.interaction.disabledOpacity,
		},
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				boxShadow: vars.depth.raised,
				transform: 'translateY(-1px)',
			},
		'[data-pending="true"]': {
			cursor: 'wait',
			opacity: vars.interaction.disabledOpacity,
		},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			boxShadow: vars.depth.recessed,
			transform: 'translateY(1px)',
		},
		'@media (forced-colors: active)': {
			backgroundColor: 'ButtonFace',
			backgroundImage: 'none',
			borderColor: 'ButtonText',
			boxShadow: 'none',
			color: 'ButtonText',
			forcedColorAdjust: 'auto',
			transform: 'none',
			'[data-disabled="true"]': {
				borderColor: 'GrayText',
				color: 'GrayText',
				opacity: 1,
			},
			'[data-pending="true"]': {
				opacity: 1,
			},
			'[data-pending="true"]::after': {
				borderInlineEndColor: 'transparent',
				borderColor: 'ButtonText',
			},
		},
		'@media (prefers-reduced-motion: reduce)': {
			'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
				{
					transform: 'none',
				},
			'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
				transform: 'none',
			},
		},
	},
	compoundVariants: [
		{
			appearance: 'solid',
			style: {
				backgroundColor: vars.color.background.neutral.solid.rest,
				backgroundImage: vars.actionControlFinish.resting,
				color: vars.color.foreground.neutral.onSolid,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.neutral.solid.hover,
						backgroundImage: vars.actionControlFinish.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.neutral.solid.pressed,
					backgroundImage: vars.actionControlFinish.recessed,
				},
				'@media (forced-colors: active)': { backgroundImage: 'none' },
			},
			tone: 'neutral',
		},
		{
			appearance: 'solid',
			style: {
				backgroundColor: vars.color.background.accent.solid.rest,
				backgroundImage: vars.actionControlFinish.resting,
				color: vars.color.foreground.accent.onSolid,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.accent.solid.hover,
						backgroundImage: vars.actionControlFinish.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.accent.solid.pressed,
					backgroundImage: vars.actionControlFinish.recessed,
				},
				'@media (forced-colors: active)': { backgroundImage: 'none' },
			},
			tone: 'accent',
		},
		{
			appearance: 'solid',
			style: {
				backgroundColor: vars.color.background.danger.solid.rest,
				backgroundImage: vars.actionControlFinish.resting,
				color: vars.color.foreground.danger.onSolid,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.danger.solid.hover,
						backgroundImage: vars.actionControlFinish.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.danger.solid.pressed,
					backgroundImage: vars.actionControlFinish.recessed,
				},
				'@media (forced-colors: active)': { backgroundImage: 'none' },
			},
			tone: 'danger',
		},
		{
			appearance: 'subtle',
			style: {
				backgroundColor: vars.color.background.neutral.subtle.rest,
				backgroundImage: vars.actionControlFinish.resting,
				color: vars.color.text.primary,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.neutral.subtle.hover,
						backgroundImage: vars.actionControlFinish.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
					backgroundImage: vars.actionControlFinish.recessed,
				},
				'@media (forced-colors: active)': { backgroundImage: 'none' },
			},
			tone: 'neutral',
		},
		{
			appearance: 'subtle',
			style: {
				backgroundColor: vars.color.background.accent.subtle.rest,
				backgroundImage: vars.actionControlFinish.resting,
				color: vars.color.foreground.accent.rest,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.accent.subtle.hover,
						backgroundImage: vars.actionControlFinish.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.accent.subtle.pressed,
					backgroundImage: vars.actionControlFinish.recessed,
				},
				'@media (forced-colors: active)': { backgroundImage: 'none' },
			},
			tone: 'accent',
		},
		{
			appearance: 'subtle',
			style: {
				backgroundColor: vars.color.background.danger.subtle.rest,
				backgroundImage: vars.actionControlFinish.resting,
				color: vars.color.foreground.danger.rest,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.danger.subtle.hover,
						backgroundImage: vars.actionControlFinish.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.danger.subtle.pressed,
					backgroundImage: vars.actionControlFinish.recessed,
				},
				'@media (forced-colors: active)': { backgroundImage: 'none' },
			},
			tone: 'danger',
		},
		{
			appearance: 'ghost',
			style: {
				backgroundColor: 'transparent',
				backgroundImage: 'none',
				borderColor: 'transparent',
				boxShadow: 'none',
				color: vars.color.text.primary,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.neutral.subtle.hover,
						boxShadow: vars.depth.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
					boxShadow: vars.depth.recessed,
				},
			},
			tone: 'neutral',
		},
		{
			appearance: 'ghost',
			style: {
				backgroundColor: 'transparent',
				backgroundImage: 'none',
				borderColor: 'transparent',
				boxShadow: 'none',
				color: vars.color.foreground.accent.rest,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.accent.subtle.hover,
						boxShadow: vars.depth.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.accent.subtle.pressed,
					boxShadow: vars.depth.recessed,
				},
			},
			tone: 'accent',
		},
		{
			appearance: 'ghost',
			style: {
				backgroundColor: 'transparent',
				backgroundImage: 'none',
				borderColor: 'transparent',
				boxShadow: 'none',
				color: vars.color.foreground.danger.rest,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.background.danger.subtle.hover,
						boxShadow: vars.depth.raised,
					},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: vars.color.background.danger.subtle.pressed,
					boxShadow: vars.depth.recessed,
				},
			},
			tone: 'danger',
		},
	],
	defaultVariants: {
		appearance: 'solid',
		isBlock: false,
		size: 'medium',
		tone: 'neutral',
	},
	variants: {
		appearance: {
			ghost: null,
			solid: null,
			subtle: null,
		},
		isBlock: {
			false: null,
			true: { inlineSize: '100%' },
		},
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				fontSize: fontMetrics.step14.fontSize,
				gap: vars.space.sp8,
				paddingInline: vars.space.sp16,
			},
			small: {
				blockSize: vars.controlSize.small,
				fontSize: fontMetrics.step12.fontSize,
				gap: vars.space.sp4,
				letterSpacing: fontMetrics.step12.letterSpacing,
				lineHeight: fontMetrics.step12.lineHeight,
				paddingInline: vars.space.sp12,
			},
		},
		tone: {
			accent: null,
			danger: null,
			neutral: null,
		},
	},
});

/** Variant type for the `Button` recipe. */
export type ButtonRecipeVariants = RecipeSelection<typeof buttonRecipe>;
