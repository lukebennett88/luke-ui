import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default function Colors() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<LoadingSpinner aria-label="Syncing" color="informative" />
			<LoadingSpinner aria-label="Syncing" color="critical" />
		</div>
	);
}
