import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';

/** Static emphasis-weight style for the `Strong` component. No variants, so no recipe indirection. */
export const styles = stylex.create({
	root: {
		fontWeight: vars.font.weight.emphasis,
	},
});
