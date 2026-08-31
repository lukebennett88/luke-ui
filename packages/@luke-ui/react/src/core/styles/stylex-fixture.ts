import * as stylex from '@stylexjs/stylex';

/** Internal `stylex.create` call so the package build extracts StyleX. Not a public export. */
export const stylexBuildFixture = stylex.create({
	probe: {
		outlineColor: 'transparent',
	},
});
