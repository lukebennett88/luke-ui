import { IconButton } from '@luke-ui/react/icon-button';

export default function Tone() {
	return (
		<div style={{ display: 'flex', gap: '1rem' }}>
			<IconButton aria-label="Close" icon="close" tone="ghost" />
			<IconButton aria-label="Delete" icon="delete" tone="critical" />
		</div>
	);
}
