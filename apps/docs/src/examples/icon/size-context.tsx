import { Cluster } from '@luke-ui/react/cluster';
import { Icon, IconSizeProvider } from '@luke-ui/react/icon';

export default () => {
	return (
		<IconSizeProvider size="small">
			<Cluster alignItems="center" gap="sp16">
				<Icon name="chevronLeft" title="Previous" />
				<Icon name="chevronRight" title="Next" />
			</Cluster>
		</IconSizeProvider>
	);
};
