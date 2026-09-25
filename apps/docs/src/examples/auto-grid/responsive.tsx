import { AutoGrid } from '@luke-ui/react/auto-grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<AutoGrid gap="sp12" minColumnInlineSize={{ initial: '10rem', bp768: '14rem' }}>
			<ExampleItem>First grid item</ExampleItem>
			<ExampleItem>Second grid item</ExampleItem>
			<ExampleItem>Third grid item</ExampleItem>
			<ExampleItem>Fourth grid item</ExampleItem>
		</AutoGrid>
	);
};
