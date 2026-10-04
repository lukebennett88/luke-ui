import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns="repeat(auto-fit, minmax(min(12rem, 100%), 1fr))" gap="sp12">
			<ExampleItem>First</ExampleItem>
			<ExampleItem>Second</ExampleItem>
			<ExampleItem>Third</ExampleItem>
			<ExampleItem>Fourth</ExampleItem>
			<ExampleItem>Fifth</ExampleItem>
			<ExampleItem>Sixth</ExampleItem>
		</Grid>
	);
};
