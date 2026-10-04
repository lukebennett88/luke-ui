import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid alignItems="end" columns={2} gap="sp12" justifyItems="center">
			<ExampleItem>Short</ExampleItem>
			<ExampleItem>
				Two
				<br />
				lines
			</ExampleItem>
		</Grid>
	);
};
