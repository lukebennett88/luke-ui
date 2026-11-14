import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => (
	<Box
		aria-label="Scrollable example"
		borderColor="decorative"
		borderStyle="solid"
		borderWidth="thin"
		overflowY="auto"
		overscrollBehavior="contain"
		padding="space.16"
		role="region"
		style={{ maxBlockSize: '8rem' }}
		tabIndex={0}
	>
		<Text elementType="p">
			Scrolling to the end of this Box does not scroll the page behind it.
		</Text>
		<Text elementType="p">Each paragraph adds height, so the Box needs its own scrollbar.</Text>
		<Text elementType="p">The Box is a focusable region, so the arrow keys scroll it too.</Text>
		<Text elementType="p">The fourth paragraph keeps adding height to the scrollable area.</Text>
		<Text elementType="p">The fifth paragraph keeps adding height to the scrollable area.</Text>
		<Text elementType="p">The sixth paragraph keeps adding height to the scrollable area.</Text>
		<Text elementType="p">The seventh paragraph keeps adding height to the scrollable area.</Text>
		<Text elementType="p">The eighth paragraph keeps adding height to the scrollable area.</Text>
		<Text elementType="p">The ninth paragraph keeps adding height to the scrollable area.</Text>
		<Text elementType="p">The tenth paragraph keeps adding height to the scrollable area.</Text>
		<Text elementType="p">The eleventh paragraph keeps adding height to the scrollable area.</Text>
		<Text elementType="p">The last paragraph reaches the end of the scrollable area.</Text>
	</Box>
);
