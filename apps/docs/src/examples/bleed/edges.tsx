import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Box
			backgroundColor="surface.recessed"
			borderColor="decorative"
			borderStyle="solid"
			borderWidth="thin"
			padding="sp16"
		>
			<Bleed inlineStart="sp16">
				<ExampleItem>Inline start edge</ExampleItem>
			</Bleed>
		</Box>
	);
};
