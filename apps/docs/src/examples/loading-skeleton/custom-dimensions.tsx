import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';

export default () => {
	return (
		<Cluster gap="sp8">
			<LoadingSkeleton>
				<Box blockSize="3rem" borderRadius="full" inlineSize="3rem" />
			</LoadingSkeleton>
			<LoadingSkeleton>
				<Box blockSize="3rem" borderRadius="full" inlineSize="3rem" />
			</LoadingSkeleton>
			<LoadingSkeleton>
				<Box blockSize="3rem" borderRadius="full" inlineSize="3rem" />
			</LoadingSkeleton>
		</Cluster>
	);
};
