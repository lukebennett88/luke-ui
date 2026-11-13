import { Grid, GridItem } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={4} gap="space.12">
			<GridItem column="1 / -1">
				<ExampleItem>Header</ExampleItem>
			</GridItem>
			<GridItem column="1" row="2 / span 2">
				<ExampleItem>Sidebar</ExampleItem>
			</GridItem>
			<GridItem column="2 / 5">
				<ExampleItem>Main</ExampleItem>
			</GridItem>
			<GridItem column="2 / 5">
				<ExampleItem>Footer</ExampleItem>
			</GridItem>
		</Grid>
	);
};
