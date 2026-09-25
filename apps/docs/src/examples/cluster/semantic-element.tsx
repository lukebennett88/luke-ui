import { Cluster } from '@luke-ui/react/cluster';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Cluster elementType="ul" gap="sp8">
			<ExampleItem elementType="li">First list item</ExampleItem>
			<ExampleItem elementType="li">Second list item</ExampleItem>
			<ExampleItem elementType="li">Third list item</ExampleItem>
		</Cluster>
	);
};
