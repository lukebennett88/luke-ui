import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => (
	<Box elementType="ul" listStyle="none" margin="0" padding="0" role="list">
		<Text elementType="li">First list item</Text>
		<Text elementType="li">Second list item</Text>
		<Text elementType="li">Third list item</Text>
	</Box>
);
