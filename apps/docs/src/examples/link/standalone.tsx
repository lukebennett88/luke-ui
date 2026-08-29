import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16">
			<Text elementType="p">
				Set up the package by following the{' '}
				<Link href="/docs/installation">installation guide</Link>.
			</Text>
			<Link href="/components" isStandalone>
				Browse all components
			</Link>
		</Box>
	);
};
