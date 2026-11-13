import { Grid, GridItem } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={2} gap="space.12">
			<GridItem column="span 2" renderRoot={(props) => <ExampleItem {...props} />}>
				Spans two columns
			</GridItem>
			<ExampleItem>Second</ExampleItem>
			<ExampleItem>Third</ExampleItem>
		</Grid>
	);
};
