import { IconButton } from '@luke-ui/react/icon-button';

export default function Size() {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<IconButton aria-label="Delete" icon="delete" size="small" />
			<IconButton aria-label="Delete" icon="delete" />
		</div>
	);
}
