import { AutoGrid } from '@luke-ui/react/auto-grid';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<div style={{ inlineSize: '10rem' }}>
			<AutoGrid gap="sp12" minColumnInlineSize="16rem">
				<ExampleItem>First grid item</ExampleItem>
				<ExampleItem>Second grid item</ExampleItem>
			</AutoGrid>
		</div>
	);
};
