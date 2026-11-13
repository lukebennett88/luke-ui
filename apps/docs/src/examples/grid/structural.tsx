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
			<GridItem area="a" renderRoot={(props) => <ExampleItem {...props} />}>
				Area A
			</GridItem>
			<GridItem area="b" renderRoot={(props) => <ExampleItem {...props} />}>
				Area B
			</GridItem>
			<GridItem area="c" renderRoot={(props) => <ExampleItem {...props} />}>
				Area C
			</GridItem>
			<GridItem area="d" renderRoot={(props) => <ExampleItem {...props} />}>
				Area D
			</GridItem>
		</Grid>
	);
};
