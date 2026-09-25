import { Stack } from '@luke-ui/react/stack';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Stack gap="sp12">
			<ExampleItem>First block item</ExampleItem>
			<ExampleItem>Second block item</ExampleItem>
			<ExampleItem>Third block item</ExampleItem>
		</Stack>
	);
};
