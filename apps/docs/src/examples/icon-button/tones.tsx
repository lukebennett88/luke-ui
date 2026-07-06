import { IconButton } from '@luke-ui/react/icon-button';
import type { JSX } from 'react';

export default function Tone(): JSX.Element {
	return (
		<div style={{ display: 'flex', gap: '1rem' }}>
			<IconButton icon="close" aria-label="Close" tone="ghost" />
			<IconButton icon="delete" aria-label="Delete" tone="critical" />
		</div>
	);
}
