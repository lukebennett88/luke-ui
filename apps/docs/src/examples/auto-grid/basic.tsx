import { AutoGrid } from '@luke-ui/react/auto-grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<AutoGrid gap="sp12" minColumnInlineSize="12rem">
			<ExampleItem>First grid item</ExampleItem>
			<ExampleItem>Second grid item</ExampleItem>
			<ExampleItem>Third grid item</ExampleItem>
			<ExampleItem>Fourth grid item</ExampleItem>
			<ExampleItem>Fifth grid item</ExampleItem>
			<ExampleItem>Sixth grid item</ExampleItem>
		</AutoGrid>
	);
};
