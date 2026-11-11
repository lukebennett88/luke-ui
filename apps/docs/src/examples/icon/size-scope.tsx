import { Cluster } from '@luke-ui/react/cluster';
import { Icon, iconSizeVars } from '@luke-ui/react/icon';

export default () => {
	return (
		<div style={iconSizeVars('small')}>
			<Cluster alignItems="center" gap="space.16">
				<Icon name="chevronLeft" title="Previous" />
				<Icon name="chevronRight" title="Next" />
				<Icon name="search" size="large" title="Search" />
			</Cluster>
		</div>
	);
};
