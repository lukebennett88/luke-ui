import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16">
			<Text elementType="p">
				An inline <Link href="#example-destination">example link</Link> sits within a sentence.
			</Text>
			<Link href="#example-destination" isStandalone>
				Standalone example link
			</Link>
		</Box>
	);
};
