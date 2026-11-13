import { Box } from '@luke-ui/react/box';
import { Grid, GridItem } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={3} gap="space.12">
			<GridItem
				column="span 2"
				renderRoot={(props) => (
					<Box {...props} backgroundColor="info.subtle" borderRadius="detail" padding="space.16" />
				)}
			>
				Featured
			</GridItem>
			<ExampleItem>Second</ExampleItem>
			<ExampleItem>Third</ExampleItem>
		</Grid>
	);
};
