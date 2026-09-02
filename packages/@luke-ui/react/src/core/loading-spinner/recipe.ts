import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import { iconSizeStyles } from '../icon/recipe.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSlottedRecipe } from '../styles/stylex-recipe.js';

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
	colorAccent: { color: vars.colorForegroundAccentRest },
	colorDanger: { color: vars.colorForegroundDangerRest },
	colorInfo: { color: vars.colorForegroundInfoRest },
	colorPrimary: { color: vars.colorTextPrimary },
	colorSecondary: { color: vars.colorTextSecondary },
	colorSuccess: { color: vars.colorForegroundSuccessRest },
	colorWarning: { color: vars.colorForegroundWarningRest },
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
		'block-size': '100%',
		display: 'block',
		'inline-size': '100%',
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
export const [loadingSpinnerRecipe, resolveLoadingSpinnerRecipeSlotStyles] = createSlottedRecipe({
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

/** Outer variant selection for the `LoadingSpinner` recipe. */
export type LoadingSpinnerRecipeVariants = RecipeSelection<typeof loadingSpinnerRecipe>;
