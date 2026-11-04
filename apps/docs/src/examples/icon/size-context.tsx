import { Cluster } from '@luke-ui/react/cluster';
import { Icon, IconSizeProvider } from '@luke-ui/react/icon';

export default () => {
	return (
		<IconSizeProvider size="size.20">
			<Cluster alignItems="center" gap="space.16">
				<Icon name="chevronLeft" title="Previous" />
				<Icon name="chevronRight" title="Next" />
			</Cluster>
		</IconSizeProvider>
	);
};
