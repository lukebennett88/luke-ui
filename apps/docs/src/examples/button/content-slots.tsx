import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Kbd } from '@luke-ui/react/kbd';

export default () => {
	return (
		<Cluster alignItems="center" gap="sp16">
			<Button startContent={<Icon name="add" />}>Add item</Button>
			<Button endContent={<Kbd>⌘S</Kbd>}>Save</Button>
		</Cluster>
	);
};
