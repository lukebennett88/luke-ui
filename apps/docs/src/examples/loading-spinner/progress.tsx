import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default function Progress() {
	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<LoadingSpinner aria-label="Uploading file: 25% complete" value={25} />
			<LoadingSpinner aria-label="Uploading file: 50% complete" value={50} />
			<LoadingSpinner aria-label="Uploading file: 75% complete" value={75} />
			<LoadingSpinner aria-label="Uploading file: 100% complete" value={100} />
		</Box>
	);
}
