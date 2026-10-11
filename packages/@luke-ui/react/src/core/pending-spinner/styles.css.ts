import { vars } from '../../theme/contract.css.js';
import { recipe } from '../styles/recipe.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';

// Both recipes fade opacity on the feedback role so the spinner and the content it covers
// cross-fade. Reduced motion turns the fade off.
const pendingFade = {
	transitionDuration: vars.motion.duration.feedback,
	transitionProperty: 'opacity',
	transitionTimingFunction: vars.motion.easing.standard,
} as const;

const reducedMotionFade = {
	'(prefers-reduced-motion: reduce)': {
		transition: 'none',
	},
} as const;

/**
 * Centred spinner overlay used by `Button` and `IconButton` while pending. It fades in on mount so
 * it cross-fades with the content it covers. Browsers without `@starting-style` show it instantly.
 */
export const pendingSpinnerOverlay = recipe({
	base: {
		opacity: 1,
		...pendingFade,
		'@starting-style': {
			opacity: 0,
		},
		'@media': {
			'(forced-colors: active)': {
				color: 'ButtonText',
			},
			...reducedMotionFade,
		},
		...spinnerOverlayBase,
	},
});

/**
 * Hides the content a pending spinner covers. It fades with `pendingSpinnerOverlay` so the two
 * cross-fade.
 */
export const pendingContent = recipe({
	base: {
		...pendingFade,
		'@media': reducedMotionFade,
	},
	defaultVariants: { isPending: false },
	variants: {
		isPending: {
			false: {},
			true: { opacity: 0 },
		},
	},
});
