import { Numeral } from '@luke-ui/react/numeral';

export default function Compact() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
			<Numeral abbreviate value={12_345} />
			<Numeral abbreviate="long" value={12_345} />
		</div>
	);
}
