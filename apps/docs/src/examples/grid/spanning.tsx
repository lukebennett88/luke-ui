import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={4} gap="sp12">
			<ExampleItem gridColumn="span 2">Spans two columns</ExampleItem>
			<ExampleItem>Second grid item</ExampleItem>
			<ExampleItem>Third grid item</ExampleItem>
			<ExampleItem>Fourth grid item</ExampleItem>
		</Grid>
	);
};
