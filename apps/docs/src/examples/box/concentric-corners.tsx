import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box backgroundColor="surface.subdued" borderRadius="overlay" padding="space.8">
			<Box backgroundColor="surface.raised" borderRadius="concentric" padding="space.12">
				<Text>The inner corners follow the outer ones.</Text>
			</Box>
		</Box>
	);
};
