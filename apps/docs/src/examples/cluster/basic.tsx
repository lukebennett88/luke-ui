import { Cluster } from '@luke-ui/react/cluster';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Cluster gap="sp8" maxInlineSize="16rem">
			<ExampleItem>First item</ExampleItem>
			<ExampleItem>Second item</ExampleItem>
			<ExampleItem>Third item</ExampleItem>
			<ExampleItem>Fourth item</ExampleItem>
			<ExampleItem>Fifth item</ExampleItem>
		</Cluster>
	);
};
