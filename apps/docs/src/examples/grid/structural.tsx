import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid
			areas={['a a', 'b c', 'd d']}
			columns="10rem 1fr"
			gap="sp12"
			minBlockSize="16rem"
			rows="auto 1fr auto"
		>
			<ExampleItem gridArea="a">Area a</ExampleItem>
			<ExampleItem gridArea="b">Area b</ExampleItem>
			<ExampleItem gridArea="c">Area c</ExampleItem>
			<ExampleItem gridArea="d">Area d</ExampleItem>
		</Grid>
	);
};
