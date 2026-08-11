import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="300">
			<Heading level={2} size="display">
				The quick brown fox jumps over the lazy dog
			</Heading>
			<Heading level={2} size="heading2">
				The quick brown fox jumps over the lazy dog
			</Heading>
			<Heading color="info" level={2} size="heading4">
				The quick brown fox jumps over the lazy dog
			</Heading>
		</Box>
	);
};
