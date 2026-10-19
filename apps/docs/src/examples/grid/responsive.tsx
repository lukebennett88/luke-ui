import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid
			areas={{ initial: ['a', 'b', 'c'], bp768: ['a b b', 'a c c'] }}
			columns={{ initial: 1, bp768: '10rem 1fr 1fr' }}
			gap="space.12"
		>
			<ExampleItem gridArea="a">Area A</ExampleItem>
			<ExampleItem gridArea="b">Area B</ExampleItem>
			<ExampleItem gridArea="c">Area C</ExampleItem>
		</Grid>
	);
};
