import { Link } from '@luke-ui/react/link';
import type { JSX } from 'react';

export default function Disabled(): JSX.Element {
	return (
		<Link href="/archived" isDisabled>
			Archived report
		</Link>
	);
}
