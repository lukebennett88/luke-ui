import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default function Sizes() {
	return (
		<Box alignItems="center" display="flex" gap="400">
			<LoadingSpinner aria-label="Loading compact control" size="small" />
			<LoadingSpinner aria-label="Loading content" size="medium" />
		</Box>
	);
}
