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
			<GridItem area="b" renderRoot={(domProps) => <ExampleItem {...domProps} />}>
				Area B
			</GridItem>
			<GridItem area="c" renderRoot={(domProps) => <ExampleItem {...domProps} />}>
				Area C
			</GridItem>
			<GridItem area="d">
				<ExampleItem>Area D</ExampleItem>
			</GridItem>
		</Grid>
	);
};
