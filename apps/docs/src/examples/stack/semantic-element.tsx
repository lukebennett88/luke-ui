import { Stack } from '@luke-ui/react/stack';
import { ExampleItem } from '#docs';

const plainListStyle = { listStyle: 'none' } as const;

export default () => {
	return (
		<Stack elementType="ul" gap="sp8" margin="0" padding="0" style={plainListStyle}>
			<ExampleItem elementType="li">First list item</ExampleItem>
			<ExampleItem elementType="li">Second list item</ExampleItem>
			<ExampleItem elementType="li">Third list item</ExampleItem>
		</Stack>
	);
};
