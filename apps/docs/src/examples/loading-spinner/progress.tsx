import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import type { JSX } from 'react';

export const meta = {
	title: 'Loading Spinner — Progress mode',
	description: 'Indeterminate and determinate progress spinners.',
};

export default function Progress(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<LoadingSpinner aria-label="Loading" />
			<LoadingSpinner aria-label="Loading profile" value={66} />
		</div>
	);
}
