import * as stylex from '@stylexjs/stylex';

/**
 * Build fixture proving StyleX extraction runs in the package build. Production component styles
 * are all Vanilla Extract; this exists only so the compiler has something to extract, and so a
 * regression in the plugin fails the build instead of passing silently.
 *
 * Not exported from any package subpath, and applied to nothing, so it cannot affect rendering.
 */
export const stylexBuildFixture = stylex.create({
	probe: {
		outlineColor: 'transparent',
	},
});
