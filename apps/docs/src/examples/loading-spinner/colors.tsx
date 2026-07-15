import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default function Colors() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<LoadingSpinner aria-label="Syncing" color="info" />
			<LoadingSpinner aria-label="Syncing" color="danger" />
		</div>
	);
}
