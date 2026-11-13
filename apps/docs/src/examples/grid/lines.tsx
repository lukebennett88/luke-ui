import { Grid, GridItem } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={4} gap="space.12">
			<GridItem column="1 / -1" renderRoot={(props) => <ExampleItem {...props} />}>
				Header
			</GridItem>
			<GridItem column="1" renderRoot={(props) => <ExampleItem {...props} />} row="2 / span 2">
				Sidebar
			</GridItem>
			<GridItem column="2 / 5" renderRoot={(props) => <ExampleItem {...props} />}>
				Main
			</GridItem>
			<GridItem column="2 / 5" renderRoot={(props) => <ExampleItem {...props} />}>
				Footer
			</GridItem>
		</Grid>
	);
};
