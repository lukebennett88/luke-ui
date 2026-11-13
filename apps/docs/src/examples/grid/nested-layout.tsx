import { Grid, GridItem } from '@luke-ui/react/grid';
import { Stack } from '@luke-ui/react/stack';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Grid columns={2} gap="space.12">
			<GridItem column="span 2" renderRoot={(domProps) => <Stack {...domProps} gap="space.8" />}>
				<ExampleItem>First</ExampleItem>
				<ExampleItem>Second</ExampleItem>
			</GridItem>
			<GridItem
				column="span 2"
				renderRoot={(domProps) => <Grid {...domProps} columns={2} gap="space.8" />}
			>
				<ExampleItem>Third</ExampleItem>
				<ExampleItem>Fourth</ExampleItem>
			</GridItem>
		</Grid>
	);
};
