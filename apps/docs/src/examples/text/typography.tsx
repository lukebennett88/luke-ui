import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default function Typography() {
	return (
		<Box display="flex" flexDirection="column" gap="300">
			<Text size="100">The quick brown fox jumps over the lazy dog.</Text>
			<Text size="200">The quick brown fox jumps over the lazy dog.</Text>
			<Text size="300">The quick brown fox jumps over the lazy dog.</Text>
			<Text fontWeight="emphasis" size="400">
				The quick brown fox jumps over the lazy dog.
			</Text>
			<Text color="secondary" size="200">
				Supporting text uses a secondary colour role.
			</Text>
		</Box>
	);
}
