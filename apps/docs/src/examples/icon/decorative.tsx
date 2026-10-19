import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Cluster alignItems="center" gap="space.4">
			<Text>Continue</Text>
			<Icon name="externalLink" size="px16" />
		</Cluster>
	);
};
