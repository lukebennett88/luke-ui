import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={2} gap="sp12">
			<ExampleItem gridColumn="span 2">Spans two columns</ExampleItem>
			<ExampleItem>Second</ExampleItem>
			<ExampleItem>Third</ExampleItem>
		</Grid>
	);
};
