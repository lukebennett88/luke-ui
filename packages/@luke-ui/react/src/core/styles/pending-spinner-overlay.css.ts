import { vars } from '../../theme/contract.css.js';
import { recipe } from './recipe.js';
import { spinnerOverlayBase } from './spinner-overlay.js';

/**
 * Centred spinner overlay used by `Button` and `IconButton` while pending. It fades in on mount so
 * it cross-fades with the content it covers. Browsers without `@starting-style` show it instantly.
 */
export const pendingSpinnerOverlay = recipe({
	base: {
		opacity: 1,
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty: 'opacity',
		transitionTimingFunction: vars.motion.easing.standard,
		'@starting-style': {
			opacity: 0,
		},
		'@media': {
			'(forced-colors: active)': {
				color: 'ButtonText',
			},
			'(prefers-reduced-motion: reduce)': {
				transition: 'none',
			},
		},
		...spinnerOverlayBase,
	},
});
