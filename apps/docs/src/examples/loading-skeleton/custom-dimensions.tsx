import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';

export default () => {
	return (
		<LoadingSkeleton>
			<Box blockSize="3rem" inlineSize="3rem" style={{ borderRadius: '9999px' }} />
		</LoadingSkeleton>
	);
};
