import { AutoGrid } from '@luke-ui/react/auto-grid';
import { Box } from '@luke-ui/react/box';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Box inlineSize="10rem">
			<AutoGrid gap="sp12" minColumnInlineSize="16rem">
				<ExampleItem>First grid item</ExampleItem>
				<ExampleItem>Second grid item</ExampleItem>
			</AutoGrid>
		</Box>
	);
};
