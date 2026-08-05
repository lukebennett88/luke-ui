/**
 * The in-place spinner overlay base shared by `Button` and `LoadingSpinner`. Both render an
 * absolutely positioned, centred surface over their content while a pending state is shown.
 */
export const spinnerOverlayBase = {
	alignItems: 'center',
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
} as const;
