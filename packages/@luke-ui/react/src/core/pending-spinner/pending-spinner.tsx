import type { JSX } from 'react';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import { pendingSpinnerOverlay } from './styles.css.js';

/** Centred spinner overlay for a pending `Button` or `IconButton`. Render it only while pending. */
export function PendingSpinner(): JSX.Element {
	return (
		<span aria-hidden className={pendingSpinnerOverlay()}>
			<LoadingSpinner aria-hidden />
		</span>
	);
}
