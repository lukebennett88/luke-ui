import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { Stack } from '@luke-ui/react/stack';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Box
			backgroundColor="surface.subdued"
			borderColor="decorative"
			borderStyle="solid"
			borderWidth="thin"
			padding="space.24"
		>
			<Stack gap="space.16">
				<ExampleItem>Inset within the padding</ExampleItem>
				<Bleed inline="space.24">
					<ExampleItem>Extends to both inline edges</ExampleItem>
				</Bleed>
			</Stack>
		</Box>
	);
};
