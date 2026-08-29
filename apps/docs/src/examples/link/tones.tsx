import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexWrap="wrap" gap="sp16">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Accent
				</Text>
				<Link href="#example-destination">Example destination</Link>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Neutral
				</Text>
				<Link href="#example-destination" tone="neutral">
					Example destination
				</Link>
			</Box>
		</Box>
	);
};
