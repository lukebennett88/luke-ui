import { Numeral } from '@luke-ui/react/numeral';
import type { JSX } from 'react';

export default function Compact(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
			<Numeral value={12_345} abbreviate />
			<Numeral value={12_345} abbreviate="long" />
		</div>
	);
}
