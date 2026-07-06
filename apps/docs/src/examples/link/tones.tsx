import { Link } from '@luke-ui/react/link';
import type { JSX } from 'react';

export default function Tones(): JSX.Element {
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
