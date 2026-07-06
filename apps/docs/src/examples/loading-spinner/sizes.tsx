import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default function Sizes() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<LoadingSpinner aria-label="Syncing" size="small" />
			<LoadingSpinner aria-label="Syncing" size="medium" />
		</div>
	);
}
