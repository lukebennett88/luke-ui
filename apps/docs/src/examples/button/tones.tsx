import { Button } from '@luke-ui/react/button';
import type { JSX } from 'react';

export default function Tones(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
			<Button tone="primary">Primary</Button>
			<Button tone="critical">Critical</Button>
			<Button tone="ghost">Ghost</Button>
			<Button tone="neutral">Neutral</Button>
		</div>
	);
}
