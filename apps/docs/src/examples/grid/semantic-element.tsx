import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={2} elementType="ul" gap="sp12">
			<ExampleItem elementType="li">First</ExampleItem>
			<ExampleItem elementType="li">Second</ExampleItem>
			<ExampleItem elementType="li">Third</ExampleItem>
			<ExampleItem elementType="li">Fourth</ExampleItem>
		</Grid>
	);
};
