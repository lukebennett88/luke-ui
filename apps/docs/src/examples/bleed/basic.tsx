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
			padding="sp24"
		>
			<Stack gap="sp16">
				<ExampleItem>Inset within the padding</ExampleItem>
				<Bleed inline="sp24">
					<ExampleItem>Extends to both inline edges</ExampleItem>
				</Bleed>
			</Stack>
		</Box>
	);
};
