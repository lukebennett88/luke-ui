import { style } from './layered-style.css.js';
import { surfaceStyle } from './surface.js';

// Test-only fixtures. They live in `.css.ts` because `style()` needs a Vanilla Extract file scope.
// Each changes its fill through `surfaceStyle` on the state attributes React Aria sets, the way a
// component recipe would.

/** A solid fill whose hover and pressed fills stay in the same role. */
export const solidStatesFixture = style({
	...surfaceStyle('accent.solid.rest'),
	selectors: {
		'&[data-hovered]': surfaceStyle('accent.solid.hover'),
		'&[data-pressed]': surfaceStyle('accent.solid.pressed'),
	},
});

/** Transparent at rest and a subtle fill on hover and press, like a ghost control. */
export const transparentToSubtleFixture = style({
	backgroundColor: 'transparent',
	selectors: {
		'&[data-hovered]': surfaceStyle('neutral.subtle.hover'),
		'&[data-pressed]': surfaceStyle('neutral.subtle.pressed'),
	},
});

/** Subtle at rest and solid when selected, so the fill changes category with its state. */
export const subtleToSolidFixture = style({
	...surfaceStyle('danger.subtle.rest'),
	selectors: {
		'&[data-selected]': surfaceStyle('danger.solid.rest'),
	},
});
