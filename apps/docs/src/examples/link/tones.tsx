import { Link } from '@luke-ui/react/link';

export default function Tones() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Link href="#">Accent</Link>
			<Link href="#" tone="neutral">
				Neutral
			</Link>
		</div>
	);
}
