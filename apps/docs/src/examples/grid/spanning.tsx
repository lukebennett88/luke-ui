import { Grid, GridItem } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={2} gap="space.12">
			<GridItem column="span 2">
				<ExampleItem>Spans two columns</ExampleItem>
			</GridItem>
			<ExampleItem>Second</ExampleItem>
			<ExampleItem>Third</ExampleItem>
		</Grid>
	);
};
