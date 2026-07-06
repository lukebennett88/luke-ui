import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import type { JSX } from 'react';

export default function Sizes(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<LoadingSpinner aria-label="Syncing" size="small" />
			<LoadingSpinner aria-label="Syncing" size="medium" />
		</div>
	);
}
