import { Link } from '@luke-ui/react/link';
import type { JSX } from 'react';

export const meta = {
	title: 'Link — Disabled',
	description: 'A disabled link cannot be focused or activated.',
};

export default function Disabled(): JSX.Element {
	return (
		<Link href="#" isDisabled>
			Archived report
		</Link>
	);
}
