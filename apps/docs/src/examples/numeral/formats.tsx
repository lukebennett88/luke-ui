import { Numeral } from '@luke-ui/react/numeral';
import type { JSX } from 'react';

export const meta = {
	title: 'Numeral — Formats',
	description: 'Percent, currency, unit, and decimal number formats.',
};

export default function Formats(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
			<Numeral value={3_500} format="percent" />
			<Numeral value={98.76} currency="AUD" />
			<Numeral value={98} unit="kilometer-per-hour" />
			<Numeral value={12_345} format="decimal" />
		</div>
	);
}
