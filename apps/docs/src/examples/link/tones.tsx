import { Link } from '@luke-ui/react/link';

export default function Tones() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Link href="#">Brand</Link>
			<Link href="#" tone="neutral">
				Neutral
			</Link>
			<div style={{ background: 'black', padding: '1rem' }}>
				<Link href="#" tone="inverted">
					Inverted
				</Link>
			</div>
		</div>
	);
}
