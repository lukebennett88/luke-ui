import * as stylex from '@stylexjs/stylex';
import { vars } from '../../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../../styles/stylex-recipe.js';
import { createSingleRecipe } from '../../styles/stylex-recipe.js';

const styles = stylex.create({
	appearanceGhost: {},
	appearanceSolid: {},
	appearanceSubtle: {},
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
		letterSpacing: '0',
		lineHeight: '20px',
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
	compoundGhostAccent: {
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
	compoundGhostDanger: {
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
	compoundGhostNeutral: {
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
	compoundSolidAccent: {
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
	compoundSolidDanger: {
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
	compoundSolidNeutral: {
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
	compoundSubtleAccent: {
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
	compoundSubtleDanger: {
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
	compoundSubtleNeutral: {
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
	isBlockFalse: {},
	isBlockTrue: { inlineSize: '100%' },
	sizeMedium: {
		blockSize: vars.controlSize.medium,
		fontSize: '14px',
		gap: vars.space.sp8,
		paddingInline: vars.space.sp16,
	},
	sizeSmall: {
		blockSize: vars.controlSize.small,
		fontSize: '12px',
		gap: vars.space.sp4,
		letterSpacing: '0.0025em',
		lineHeight: '16px',
		paddingInline: vars.space.sp12,
	},
	toneAccent: {},
	toneDanger: {},
	toneNeutral: {},
});

/** Semantic appearance and material recipe shared by Button and IconButton. */
export const [buttonRecipe, resolveButtonRecipeStyles] = createSingleRecipe({
	base: styles.base,
	compoundVariants: [
		{ style: styles.compoundSolidNeutral, variants: { appearance: 'solid', tone: 'neutral' } },
		{ style: styles.compoundSolidAccent, variants: { appearance: 'solid', tone: 'accent' } },
		{ style: styles.compoundSolidDanger, variants: { appearance: 'solid', tone: 'danger' } },
		{ style: styles.compoundSubtleNeutral, variants: { appearance: 'subtle', tone: 'neutral' } },
		{ style: styles.compoundSubtleAccent, variants: { appearance: 'subtle', tone: 'accent' } },
		{ style: styles.compoundSubtleDanger, variants: { appearance: 'subtle', tone: 'danger' } },
		{ style: styles.compoundGhostNeutral, variants: { appearance: 'ghost', tone: 'neutral' } },
		{ style: styles.compoundGhostAccent, variants: { appearance: 'ghost', tone: 'accent' } },
		{ style: styles.compoundGhostDanger, variants: { appearance: 'ghost', tone: 'danger' } },
	],
	defaultVariants: {
		appearance: 'solid',
		isBlock: false,
		size: 'medium',
		tone: 'neutral',
	},
	variants: {
		appearance: {
			ghost: styles.appearanceGhost,
			solid: styles.appearanceSolid,
			subtle: styles.appearanceSubtle,
		},
		isBlock: {
			false: styles.isBlockFalse,
			true: styles.isBlockTrue,
		},
		size: {
			medium: styles.sizeMedium,
			small: styles.sizeSmall,
		},
		tone: {
			accent: styles.toneAccent,
			danger: styles.toneDanger,
			neutral: styles.toneNeutral,
		},
	},
});

export type ButtonRecipeVariants = RecipeSelection<typeof buttonRecipe>;
