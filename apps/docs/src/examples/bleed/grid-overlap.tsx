import { Bleed } from '@luke-ui/react/bleed';
import { Box } from '@luke-ui/react/box';
import { Grid } from '@luke-ui/react/grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Box
			backgroundColor="surface.recessed"
			borderColor="decorative"
			borderStyle="solid"
			borderWidth="thin"
			padding="sp24"
		>
			<Grid columns={3} gap="sp8">
				<ExampleItem>1</ExampleItem>
				<ExampleItem>2</ExampleItem>
				<ExampleItem>3</ExampleItem>
				<ExampleItem>4</ExampleItem>
				<Bleed all="sp12" position="relative">
					<ExampleItem backgroundColor="info.subtle.rest" blockSize="100%">
						5
					</ExampleItem>
				</Bleed>
				<ExampleItem>6</ExampleItem>
				<ExampleItem>7</ExampleItem>
				<ExampleItem>8</ExampleItem>
				<ExampleItem>9</ExampleItem>
			</Grid>
		</Box>
	);
};
