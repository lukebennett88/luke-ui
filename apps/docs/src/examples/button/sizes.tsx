import { Button } from '@luke-ui/react/button';
import type { JSX } from 'react';

export const meta = {
	title: 'Button — Sizes',
	description:
		'Small and medium buttons side by side. Use small in dense UIs, medium for most cases.',
};

export default function Sizes(): JSX.Element {
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
			<Button size="small">Small</Button>
			<Button size="medium">Medium</Button>
		</div>
	);
}
