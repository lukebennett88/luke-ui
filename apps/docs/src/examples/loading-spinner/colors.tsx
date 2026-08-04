import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default () => {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<LoadingSpinner aria-label="Loading content" />
			<LoadingSpinner aria-label="Loading highlighted content" color="accent" />
		</Box>
	);
};
