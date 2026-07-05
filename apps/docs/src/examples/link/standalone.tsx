import { Link } from '@luke-ui/react/link';
import type { JSX } from 'react';

export const meta = {
	title: 'Link — Standalone',
	description: 'Use `isStandalone` for links that stand on their own, or inline links in prose.',
};

export default function Standalone(): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			<Link href="#" isStandalone>
				Standalone link
			</Link>
			<p>
				This is an <Link href="#">inline link</Link> inside a sentence.
			</p>
		</div>
	);
}
