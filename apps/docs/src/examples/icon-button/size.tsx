import { IconButton } from '@luke-ui/react/icon-button';
import type { JSX } from 'react';

export const meta = {
	title: 'Icon Button — Size',
	description: 'A small icon button for tighter spaces.',
};

export default function Size(): JSX.Element {
	return (
		<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
			<IconButton icon="delete" aria-label="Delete" size="small" />
			<IconButton icon="delete" aria-label="Delete" />
		</div>
	);
}
