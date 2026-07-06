import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import type { JSX } from 'react';

export default function Colors(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<LoadingSpinner aria-label="Syncing" color="informative" />
			<LoadingSpinner aria-label="Syncing" color="critical" />
		</div>
	);
}
