import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';

/**
 * Static emphasis-weight style for the `Strong` component.
 *
 * Not a `recipe()`: `Strong` composes `Text` rather than styling its own element, layering this
 * compiled style over Text's own styles through `xstyle` so the two resolve in one
 * `stylex.props(...)` call. A recipe returns resolved DOM props instead, which would mean
 * flattening to a class before Text applies its final `xstyle`.
 */
export const styles = stylex.create({
	root: {
		fontWeight: vars.font.weight.emphasis,
	},
});
