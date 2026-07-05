import { Numeral } from '@luke-ui/react/numeral';
import type { JSX } from 'react';

export const meta = {
	title: 'Numeral — Precision',
	description: 'Fixed fraction digits or a minimum and maximum range.',
};

export default function Precision(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
			<Numeral value={98.7654} precision={2} />
			<Numeral value={1_234.5678} precision={[0, 2]} />
		</div>
	);
}
