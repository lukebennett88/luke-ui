import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
	base: {
		alignItems: 'center',
		display: 'flex',
		inset: 0,
		justifyContent: 'center',
		position: 'absolute',
	},
});

/**
 * The in-place spinner overlay base shared by `Button` and `LoadingSpinner`. Both render an
 * absolutely positioned, centred surface over their content while a pending state is shown.
 *
 * Compiled StyleX styles compose across modules, so a consumer that needs extra declarations
 * (`Button` adds a `forced-colors` colour) passes both to `stylex.props` / a recipe slot rather
 * than restating these five properties.
 */
export const spinnerOverlayBase = styles.base;
