import { Grid, minmax, repeat } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={repeat('auto-fit', minmax('min(12rem, 100%)', '1fr'))} gap="sp12">
			<ExampleItem>First grid item</ExampleItem>
			<ExampleItem>Second grid item</ExampleItem>
			<ExampleItem>Third grid item</ExampleItem>
			<ExampleItem>Fourth grid item</ExampleItem>
			<ExampleItem>Fifth grid item</ExampleItem>
			<ExampleItem>Sixth grid item</ExampleItem>
		</Grid>
	);
};
