import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={2} gap="space.12">
			<ExampleItem>First</ExampleItem>
			<ExampleItem>Second</ExampleItem>
			<ExampleItem>Third</ExampleItem>
			<ExampleItem>Fourth</ExampleItem>
		</Grid>
	);
};
