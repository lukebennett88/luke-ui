import { Box } from '@luke-ui/react/box';
import { Code } from '@luke-ui/react/code';
import { Container } from '@luke-ui/react/container';

export default () => {
	return (
		<Container maxInlineSize="container.672" paddingInline="space.16">
			<Box
				backgroundColor="surface.subdued"
				borderColor="decorative"
				borderRadius="detail"
				borderStyle="solid"
				borderWidth="thin"
				padding="space.16"
			>
				Content stays centred with a maximum inline size of <Code>42rem</Code>.
			</Box>
		</Container>
	);
};
