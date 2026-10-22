import { Box } from '@luke-ui/react/box';
import { Stack } from '@luke-ui/react/stack';
import { Strong } from '@luke-ui/react/strong';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="space.12">
			<Box backgroundColor="accent.solid" display="grid" gap="space.8" padding="space.16">
				<Text>Inherited primary</Text>
				<Text color="secondary">Secondary</Text>
				<Text color="danger">Danger</Text>
			</Box>
			<Box backgroundColor="accent.subtle" padding="space.16">
				<Text color="danger">Danger</Text>
			</Box>
			<Text color="secondary">
				Secondary with <Strong>strong emphasis</Strong>
			</Text>
		</Stack>
	);
};
