import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => (
	<Box
		borderColor="decorative"
		borderStyle="solid"
		borderWidth="thin"
		overflowY="auto"
		overscrollBehavior="contain"
		padding="space.16"
		style={{ maxBlockSize: '8rem' }}
	>
		<Text>Scrolling to the end of this Box does not scroll the page behind it.</Text>
		<Text>Each paragraph adds height, so the Box needs its own scrollbar.</Text>
		<Text>The last paragraph reaches the end of the scrollable area.</Text>
	</Box>
);
