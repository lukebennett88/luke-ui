import { style } from './layered-style.css.js';
import { interactionStateLayer } from './state-layer.css.js';
import { adaptiveStateLayer } from './state-layer.js';
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

/** Transparent at rest and a subtle fill on hover and press, like a low-prominence Button. */
export const transparentToSubtleFixture = style({
	backgroundColor: 'transparent',
	backgroundImage: `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`,
	vars: { [interactionStateLayer]: 'transparent' },
	selectors: {
		'&[data-hovered]': adaptiveStateLayer('hover'),
		'&[data-pressed]': adaptiveStateLayer('pressed'),
	},
});

/** Subtle at rest and solid when selected, so the fill changes category with its state. */
export const subtleToSolidFixture = style({
	...surfaceStyle('danger.subtle'),
	selectors: {
		'&[data-selected]': surfaceStyle('danger.solid.rest'),
	},
});
