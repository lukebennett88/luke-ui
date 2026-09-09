import { recipe } from './recipe.js';
import { spinnerOverlayBase } from './spinner-overlay.js';

/** Centred spinner overlay used by `Button` and `IconButton` while pending. */
export const pendingSpinnerOverlay = recipe({
	base: {
		'@media': {
			'(forced-colors: active)': {
				color: 'ButtonText',
			},
		},
		...spinnerOverlayBase,
	},
});
