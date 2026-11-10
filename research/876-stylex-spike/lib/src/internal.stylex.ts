import * as stylex from '@stylexjs/stylex';

/**
 * Private inherited properties. Keys that start with `--` keep their literal names, so they match
 * the names the Vanilla Extract build uses and the theme stylesheet can read or write them.
 */
export const internal = stylex.defineVars({
	'--luke-internal-foreground-primary': 'initial',
	'--luke-internal-foreground-secondary': 'initial',
	'--luke-internal-foreground-tone': 'initial',
	'--luke-internal-focus': 'initial',
	'--luke-internal-surface-fill-rest': 'initial',
	'--luke-internal-surface-fill-hover': 'initial',
	'--luke-internal-surface-fill-pressed': 'initial',
	'--luke-internal-surface-finish-hover': 'initial',
	'--luke-internal-surface-finish-pressed': 'initial',
	'--luke-internal-surface-shadow-pressed': 'initial',
	// Geometry a Box publishes for a `concentric` child (#874).
	'--luke-internal-concentric-radius': 'initial',
	'--luke-internal-concentric-inset-block-start': 'initial',
	'--luke-internal-concentric-inset-block-end': 'initial',
	'--luke-internal-concentric-inset-inline-start': 'initial',
	'--luke-internal-concentric-inset-inline-end': 'initial',
});

/**
 * The registered state-layer colour. StyleX registers typed properties with `inherits: true`, unlike
 * the Vanilla Extract build, which registers this one with `inherits: false`.
 */
export const stateLayer = stylex.defineVars({
	'--luke-interaction-state-layer': stylex.types.color({ default: 'transparent' }),
});
