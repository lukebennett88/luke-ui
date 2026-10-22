import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Text>
			Open the{' '}
			<Link href="#example-destination" isDisabled>
				example destination
			</Link>
			.
		</Text>
	);
};
