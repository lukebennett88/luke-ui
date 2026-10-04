import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid
			areas={['a a', 'b c', 'd d']}
			columns="1fr 1fr"
			gap="sp12"
			minBlockSize="16rem"
			rows="auto 1fr auto"
		>
			<ExampleItem gridArea="a">Area A</ExampleItem>
			<ExampleItem gridArea="b">Area B</ExampleItem>
			<ExampleItem gridArea="c">Area C</ExampleItem>
			<ExampleItem gridArea="d">Area D</ExampleItem>
		</Grid>
	);
};
