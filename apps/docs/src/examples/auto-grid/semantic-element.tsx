import { AutoGrid } from '@luke-ui/react/auto-grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<AutoGrid elementType="ul" gap="sp12" minColumnInlineSize="12rem">
			<ExampleItem elementType="li">First list item</ExampleItem>
			<ExampleItem elementType="li">Second list item</ExampleItem>
			<ExampleItem elementType="li">Third list item</ExampleItem>
			<ExampleItem elementType="li">Fourth list item</ExampleItem>
		</AutoGrid>
	);
};
