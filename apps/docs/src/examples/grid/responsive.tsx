import { Grid, GridItem } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid
			areas={{ initial: ['a', 'b', 'c'], bp768: ['a b b', 'a c c'] }}
			columns={{ initial: 1, bp768: '10rem 1fr 1fr' }}
			gap="space.12"
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
		</Grid>
	);
};
