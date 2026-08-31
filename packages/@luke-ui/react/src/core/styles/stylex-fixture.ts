import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';

/** Internal `stylex.create` call so the package build extracts StyleX. Not a public export. */
export const stylexBuildFixture = stylex.create({
	probe: {
		outlineColor: 'transparent',
		padding: tokens.spaceSp16,
	},
});
