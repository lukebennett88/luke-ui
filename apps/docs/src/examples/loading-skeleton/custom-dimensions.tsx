import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';

export default () => {
	return (
		<Box display="flex" gap="sp8">
			<LoadingSkeleton>
				<Box blockSize="3rem" borderRadius="full" inlineSize="3rem" />
			</LoadingSkeleton>
			<LoadingSkeleton>
				<Box blockSize="3rem" borderRadius="full" inlineSize="3rem" />
			</LoadingSkeleton>
			<LoadingSkeleton>
				<Box blockSize="3rem" borderRadius="full" inlineSize="3rem" />
			</LoadingSkeleton>
		</Box>
	);
};
