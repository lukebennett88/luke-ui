import * as stylex from '@stylexjs/stylex';

/**
 * Static italic style for the `Em` component.
 *
 * Not a `recipe()`: `Em` composes `Text` rather than styling its own element, layering this
 * compiled style over Text's own styles through `xstyle` so the two resolve in one
 * `stylex.props(...)` call. A recipe returns resolved DOM props instead, which would mean
 * flattening to a class before Text applies its final `xstyle`.
 */
export const styles = stylex.create({
	root: {
		fontStyle: 'italic',
	},
});
