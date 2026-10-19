import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

const plainListStyle = { listStyle: 'none' } as const;

export default () => {
	return (
		<Grid columns={2} elementType="ul" gap="space.12" margin="0" padding="0" style={plainListStyle}>
			<ExampleItem elementType="li">First</ExampleItem>
			<ExampleItem elementType="li">Second</ExampleItem>
			<ExampleItem elementType="li">Third</ExampleItem>
			<ExampleItem elementType="li">Fourth</ExampleItem>
		</Grid>
	);
};
