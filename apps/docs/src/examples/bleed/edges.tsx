import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Box
			backgroundColor="surface.subdued"
			borderColor="decorative"
			borderStyle="solid"
			borderWidth="border.1"
			padding="space.16"
		>
			<Bleed inlineStart="space.16">
				<ExampleItem>Inline start edge</ExampleItem>
			</Bleed>
		</Box>
	);
};
