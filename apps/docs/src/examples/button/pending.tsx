import { Button } from '@luke-ui/react/button';
import type { JSX } from 'react';

export default function Pending(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Button isPending>Saving</Button>
		</div>
	);
}
