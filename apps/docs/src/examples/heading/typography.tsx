import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';

export default function Typography() {
	return (
		<Box display="flex" flexDirection="column" gap="300">
			<Heading level={2} size="900">
				The quick brown fox jumps over the lazy dog
			</Heading>
			<Heading level={2} size="700">
				The quick brown fox jumps over the lazy dog
			</Heading>
			<Heading color="info" level={2} size="500">
				The quick brown fox jumps over the lazy dog
			</Heading>
		</Box>
	);
}
