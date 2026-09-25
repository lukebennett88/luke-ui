import { Cluster } from '@luke-ui/react/cluster';
import { ExampleItem } from '#docs';

export default () => {
	return (
		<Cluster alignItems="flex-end" gap="sp8" justifyContent="space-between">
			<ExampleItem>Short item</ExampleItem>
			<ExampleItem>
				A taller item
				<br />
				with two lines
			</ExampleItem>
		</Cluster>
	);
};
