import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import type { JSX } from 'react';

export const meta = {
	title: 'Loading Spinner — Colors',
	description: 'Informative and critical spinner colors.',
};

export default function Colors(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<LoadingSpinner aria-label="Syncing" color="informative" />
			<LoadingSpinner aria-label="Syncing" color="critical" />
		</div>
	);
}
