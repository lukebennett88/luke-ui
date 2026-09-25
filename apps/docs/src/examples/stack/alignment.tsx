import { Stack } from '@luke-ui/react/stack';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Stack alignItems="center" gap="sp12">
			<ExampleItem>Short item</ExampleItem>
			<ExampleItem>A wider item</ExampleItem>
			<ExampleItem>The widest item</ExampleItem>
		</Stack>
	);
};
