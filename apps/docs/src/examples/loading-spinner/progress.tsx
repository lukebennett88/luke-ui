import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default function Progress() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<LoadingSpinner aria-label="Loading" />
			<LoadingSpinner aria-label="Loading profile" value={66} />
		</div>
	);
}
