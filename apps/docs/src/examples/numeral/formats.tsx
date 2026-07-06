import { Numeral } from '@luke-ui/react/numeral';

export default function Formats() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
			<Numeral format="percent" value={3_500} />
			<Numeral currency="AUD" value={98.76} />
			<Numeral unit="kilometer-per-hour" value={98} />
			<Numeral format="decimal" value={12_345} />
		</div>
	);
}
