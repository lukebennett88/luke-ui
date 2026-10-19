import { Stack } from '@luke-ui/react/stack';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Stack alignItems="center" gap="space.12">
			<ExampleItem>Short item</ExampleItem>
			<ExampleItem>A wider item</ExampleItem>
			<ExampleItem>The widest item</ExampleItem>
		</Stack>
	);
};
