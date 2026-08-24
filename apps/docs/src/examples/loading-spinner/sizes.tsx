import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default () => {
	return (
		<Box alignItems="center" display="flex" gap="sp16">
			<LoadingSpinner aria-label="Loading inline content" size="xsmall" />
			<LoadingSpinner aria-label="Loading compact control" size="small" />
			<LoadingSpinner aria-label="Loading content" size="medium" />
			<LoadingSpinner aria-label="Loading prominent content" size="large" />
		</Box>
	);
};
