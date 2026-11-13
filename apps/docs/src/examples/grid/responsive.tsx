import { Grid, GridItem } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid
			areas={{ initial: ['a', 'b', 'c'], bp768: ['a b b', 'a c c'] }}
			columns={{ initial: 1, bp768: '10rem 1fr 1fr' }}
			gap="space.12"
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
		</Grid>
	);
};
