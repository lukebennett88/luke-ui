import { Grid, GridItem } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid
			areas={['a a', 'b c', 'd d']}
			columns="1fr 1fr"
			gap="space.12"
			rows="auto 1fr auto"
			style={{ minBlockSize: '16rem' }}
		>
			<GridItem area="a">
				<ExampleItem>Area A</ExampleItem>
			</GridItem>
			<GridItem area="b">
				<ExampleItem>Area B</ExampleItem>
			</GridItem>
			<GridItem area="c">
				<ExampleItem>Area C</ExampleItem>
			</GridItem>
			<GridItem area="d">
				<ExampleItem>Area D</ExampleItem>
			</GridItem>
		</Grid>
	);
};
