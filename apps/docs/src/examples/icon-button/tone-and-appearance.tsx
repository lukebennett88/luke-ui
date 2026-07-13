import { IconButton } from '@luke-ui/react/icon-button';

export default function ToneAndAppearance() {
	return (
		<div style={{ display: 'flex', gap: '1rem' }}>
			<IconButton appearance="ghost" aria-label="Close" icon="close" tone="neutral" />
			<IconButton aria-label="Delete" icon="delete" tone="danger" />
		</div>
	);
}
