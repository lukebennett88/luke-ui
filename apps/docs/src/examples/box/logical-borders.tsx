import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => (
	<Box
		borderColor="decorative"
		borderStyle="solid"
		borderWidth="none"
		borderBlockEndWidth="thin"
		borderInlineStartWidth="thick"
		padding="space.16"
	>
		<Text>A section with a separator</Text>
	</Box>
);
