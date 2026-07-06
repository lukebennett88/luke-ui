import { Link } from '@luke-ui/react/link';

export default function Disabled() {
	return (
		<Link href="/archived" isDisabled>
			Archived report
		</Link>
	);
}
