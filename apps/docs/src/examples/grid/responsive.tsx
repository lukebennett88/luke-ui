import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={{ initial: 2, bp768: 4 }} gap="sp12">
			<ExampleItem gridColumn={{ initial: 'span 2', bp768: 'span 3' }}>
				Spans two columns initially, three from bp768
			</ExampleItem>
			<ExampleItem>Second grid item</ExampleItem>
			<ExampleItem>Third grid item</ExampleItem>
			<ExampleItem>Fourth grid item</ExampleItem>
		</Grid>
	);
};
