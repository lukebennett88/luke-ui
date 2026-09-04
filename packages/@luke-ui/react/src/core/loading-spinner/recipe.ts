import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import { iconSizeStyles } from '../icon/recipe.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';
import type { SlotRecipeSelection } from '../styles/stylex-recipe.js';
import { createSlottedRecipe, createSlottedRecipeStyles } from '../styles/stylex-recipe.js';

const rotationDuration = '1.2s';
const rubberBandDuration = '2s';
const rubberBandEasing = 'cubic-bezier(0.42, 0, 0.58, 1)';

/**
 * @internal
 */
export const spinAnimationName = stylex.keyframes({
	to: { transform: 'rotate(360deg)' },
});

/**
 * @internal
 */
export const rubberBandAnimationName = stylex.keyframes({
	'0%': { strokeDasharray: '2 100' },
	'50%': { strokeDasharray: '65 100', strokeDashoffset: -20 },
	'100%': { strokeDasharray: '2 100', strokeDashoffset: -100 },
});

const styles = stylex.create({
	childrenWrapper: {
		alignItems: 'center',
		display: 'inline-flex',
		justifyContent: 'center',
		position: 'relative',
	},
	colorAccent: { color: vars.color.foreground.accent.rest },
	colorDanger: { color: vars.color.foreground.danger.rest },
	colorInfo: { color: vars.color.foreground.info.rest },
	colorPrimary: { color: vars.color.text.primary },
	colorSecondary: { color: vars.color.text.secondary },
	colorSuccess: { color: vars.color.foreground.success.rest },
	colorWarning: { color: vars.color.foreground.warning.rest },
	hiddenChildren: {
		display: 'contents',
		visibility: 'hidden',
	},
	indicator: {
		animationDuration: rubberBandDuration,
		animationIterationCount: 'infinite',
		animationName: rubberBandAnimationName,
		animationTimingFunction: rubberBandEasing,
		strokeDasharray: '100 100',
		'@media (forced-colors: active)': {
			animationName: 'none',
			strokeDasharray: '25 100',
			strokeDashoffset: 0,
		},
		'@media (prefers-reduced-motion: reduce)': {
			animationName: 'none',
			strokeDasharray: '25 100',
			strokeDashoffset: 0,
		},
	},
	root: {
		animationDuration: rotationDuration,
		animationIterationCount: 'infinite',
		animationName: spinAnimationName,
		animationTimingFunction: 'linear',
		color: 'currentColor',
		display: 'inline-flex',
		flexShrink: 0,
		'@media (forced-colors: active)': { animationName: 'none' },
		'@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
	},
	svg: {
		blockSize: '100%',
		display: 'block',
		inlineSize: '100%',
		transform: 'rotate(-90deg)',
	},
});

/**
 * Slotted recipe for the `LoadingSpinner` primitive.
 *
 * `loadingSpinner({ color, size }).root() / .svg() / .indicator()` for the spinner
 * itself, and `.childrenWrapper() / .hiddenChildren() / .spinnerOverlay()` for the
 * in-place children overlay.
 */
const loadingSpinnerRecipeStyles = createSlottedRecipeStyles({
	defaultVariants: {
		size: 'medium',
	},
	slots: {
		childrenWrapper: styles.childrenWrapper,
		hiddenChildren: styles.hiddenChildren,
		indicator: styles.indicator,
		root: styles.root,
		spinnerOverlay: spinnerOverlayBase,
		svg: styles.svg,
	},
	variants: {
		color: {
			accent: { root: styles.colorAccent },
			danger: { root: styles.colorDanger },
			info: { root: styles.colorInfo },
			primary: { root: styles.colorPrimary },
			secondary: { root: styles.colorSecondary },
			success: { root: styles.colorSuccess },
			warning: { root: styles.colorWarning },
		},
		size: {
			large: { root: iconSizeStyles.large },
			medium: { root: iconSizeStyles.medium },
			small: { root: iconSizeStyles.small },
			xsmall: { root: iconSizeStyles.xsmall },
		},
	},
});

/** Canonical per-slot resolver for the `LoadingSpinner` primitive. */
export const resolveLoadingSpinnerRecipeSlotStyles = loadingSpinnerRecipeStyles.resolveSlotStyles;

/** Slotted recipe for the `LoadingSpinner` primitive. */
export const loadingSpinnerRecipe = createSlottedRecipe(loadingSpinnerRecipeStyles);

/** Outer variant selection for the `LoadingSpinner` recipe. */
export type LoadingSpinnerRecipeVariants = SlotRecipeSelection<
	typeof resolveLoadingSpinnerRecipeSlotStyles
>;
