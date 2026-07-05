import { Button } from '@luke-ui/react/button';
import type { JSX } from 'react';

export const meta = {
	title: 'Button — Pending',
	description: 'Show a pending state with `isPending` while an async action is in progress.',
};

export default function Pending(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Button isPending>Saving</Button>
		</div>
	);
}
