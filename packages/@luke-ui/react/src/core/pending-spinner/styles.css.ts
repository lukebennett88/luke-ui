import { vars } from '../../theme/contract.css.js';
import { recipe } from '../styles/recipe.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';

// Both recipes fade opacity on the feedback role so the spinner and the content it covers
// cross-fade. A fade is not movement, so it stays under reduced motion.
const pendingFade = {
	transitionDuration: vars.motion.duration.feedback,
	transitionProperty: 'opacity',
	transitionTimingFunction: vars.motion.easing.standard,
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
		},
		...spinnerOverlayBase,
	},
});

/**
 * Hides the content a pending spinner covers. It fades with `pendingSpinnerOverlay` so the two
 * cross-fade.
 */
export const pendingContent = recipe({
	base: pendingFade,
	defaultVariants: { isPending: false },
	variants: {
		isPending: {
			false: {},
			true: { opacity: 0 },
		},
	},
});
