import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={3} gap="sp12">
			<ExampleItem>First grid item</ExampleItem>
			<ExampleItem>Second grid item</ExampleItem>
			<ExampleItem>Third grid item</ExampleItem>
			<ExampleItem>Fourth grid item</ExampleItem>
		</Grid>
	);
};
