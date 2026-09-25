import { Stack } from '@luke-ui/react/stack';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Stack elementType="ul" gap="sp8">
			<ExampleItem elementType="li">First list item</ExampleItem>
			<ExampleItem elementType="li">Second list item</ExampleItem>
			<ExampleItem elementType="li">Third list item</ExampleItem>
		</Stack>
	);
};
