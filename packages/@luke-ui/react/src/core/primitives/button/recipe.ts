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
		borderRadius: vars.radiusControl,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depthResting,
		boxSizing: 'border-box',
		cursor: 'default',
		display: 'inline-flex',
		fontFamily: vars.fontFamilyBody,
		fontWeight: vars.fontWeightLabel,
		isolation: 'isolate',
		justifyContent: 'center',
		letterSpacing: '0',
		lineHeight: '20px',
		'min-block-size': vars.controlSizeMinTarget,
		'min-inline-size': vars.controlSizeMinTarget,
		position: 'relative',
		textDecoration: 'none',
		transform: 'translateY(0)',
		transitionDuration: vars.motionDurationFeedback,
		transitionProperty: 'background-color, border-color, box-shadow, color, opacity, transform',
		transitionTimingFunction: vars.motionEasingStandard,
		whiteSpace: 'nowrap',
		'[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: vars.interactionDisabledOpacity,
		},
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				boxShadow: vars.depthRaised,
				transform: 'translateY(-1px)',
			},
		'[data-pending="true"]': {
			cursor: 'wait',
			opacity: vars.interactionDisabledOpacity,
		},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			boxShadow: vars.depthRecessed,
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
				'border-inline-end-color': 'transparent',
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
		color: vars.colorForegroundAccentRest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundAccentSubtleHover,
				boxShadow: vars.depthRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtlePressed,
			boxShadow: vars.depthRecessed,
		},
	},
	compoundGhostDanger: {
		backgroundColor: 'transparent',
		backgroundImage: 'none',
		borderColor: 'transparent',
		boxShadow: 'none',
		color: vars.colorForegroundDangerRest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundDangerSubtleHover,
				boxShadow: vars.depthRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundDangerSubtlePressed,
			boxShadow: vars.depthRecessed,
		},
	},
	compoundGhostNeutral: {
		backgroundColor: 'transparent',
		backgroundImage: 'none',
		borderColor: 'transparent',
		boxShadow: 'none',
		color: vars.colorTextPrimary,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundNeutralSubtleHover,
				boxShadow: vars.depthRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundNeutralSubtlePressed,
			boxShadow: vars.depthRecessed,
		},
	},
	compoundSolidAccent: {
		backgroundColor: vars.colorBackgroundAccentSolidRest,
		backgroundImage: vars.actionControlFinishResting,
		color: vars.colorForegroundAccentOnSolid,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundAccentSolidHover,
				backgroundImage: vars.actionControlFinishRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundAccentSolidPressed,
			backgroundImage: vars.actionControlFinishRecessed,
		},
		'@media (forced-colors: active)': { backgroundImage: 'none' },
	},
	compoundSolidDanger: {
		backgroundColor: vars.colorBackgroundDangerSolidRest,
		backgroundImage: vars.actionControlFinishResting,
		color: vars.colorForegroundDangerOnSolid,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundDangerSolidHover,
				backgroundImage: vars.actionControlFinishRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundDangerSolidPressed,
			backgroundImage: vars.actionControlFinishRecessed,
		},
		'@media (forced-colors: active)': { backgroundImage: 'none' },
	},
	compoundSolidNeutral: {
		backgroundColor: vars.colorBackgroundNeutralSolidRest,
		backgroundImage: vars.actionControlFinishResting,
		color: vars.colorForegroundNeutralOnSolid,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundNeutralSolidHover,
				backgroundImage: vars.actionControlFinishRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundNeutralSolidPressed,
			backgroundImage: vars.actionControlFinishRecessed,
		},
		'@media (forced-colors: active)': { backgroundImage: 'none' },
	},
	compoundSubtleAccent: {
		backgroundColor: vars.colorBackgroundAccentSubtleRest,
		backgroundImage: vars.actionControlFinishResting,
		color: vars.colorForegroundAccentRest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundAccentSubtleHover,
				backgroundImage: vars.actionControlFinishRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtlePressed,
			backgroundImage: vars.actionControlFinishRecessed,
		},
		'@media (forced-colors: active)': { backgroundImage: 'none' },
	},
	compoundSubtleDanger: {
		backgroundColor: vars.colorBackgroundDangerSubtleRest,
		backgroundImage: vars.actionControlFinishResting,
		color: vars.colorForegroundDangerRest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundDangerSubtleHover,
				backgroundImage: vars.actionControlFinishRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundDangerSubtlePressed,
			backgroundImage: vars.actionControlFinishRecessed,
		},
		'@media (forced-colors: active)': { backgroundImage: 'none' },
	},
	compoundSubtleNeutral: {
		backgroundColor: vars.colorBackgroundNeutralSubtleRest,
		backgroundImage: vars.actionControlFinishResting,
		color: vars.colorTextPrimary,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"]):not([data-pending="true"])':
			{
				backgroundColor: vars.colorBackgroundNeutralSubtleHover,
				backgroundImage: vars.actionControlFinishRaised,
			},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			backgroundColor: vars.colorBackgroundNeutralSubtlePressed,
			backgroundImage: vars.actionControlFinishRecessed,
		},
		'@media (forced-colors: active)': { backgroundImage: 'none' },
	},
	isBlockFalse: {},
	isBlockTrue: { 'inline-size': '100%' },
	sizeMedium: {
		'block-size': vars.controlSizeMedium,
		fontSize: '14px',
		gap: vars.spaceSp8,
		'padding-inline': vars.spaceSp16,
	},
	sizeSmall: {
		'block-size': vars.controlSizeSmall,
		fontSize: '12px',
		gap: vars.spaceSp4,
		letterSpacing: '0.0025em',
		lineHeight: '16px',
		'padding-inline': vars.spaceSp12,
	},
	toneAccent: {},
	toneDanger: {},
	toneNeutral: {},
});

/** Semantic appearance and material recipe shared by Button and IconButton. */
export const { recipe: buttonRecipe, resolveStyles: resolveButtonRecipeStyles } =
	createSingleRecipe({
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
