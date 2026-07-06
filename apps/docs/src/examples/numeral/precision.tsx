import { Numeral } from '@luke-ui/react/numeral';

export default function Precision() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
			<Numeral precision={2} value={98.7654} />
			<Numeral precision={[0, 2]} value={1_234.5678} />
		</div>
	);
}
