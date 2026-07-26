import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default function Colors() {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<LoadingSpinner aria-label="Loading primary content" color="primary" />
			<LoadingSpinner aria-label="Loading secondary content" color="secondary" />
			<LoadingSpinner aria-label="Loading information" color="info" />
			<LoadingSpinner aria-label="Loading success state" color="success" />
			<LoadingSpinner aria-label="Loading warning state" color="warning" />
			<LoadingSpinner aria-label="Loading error state" color="danger" />
		</Box>
	);
}
