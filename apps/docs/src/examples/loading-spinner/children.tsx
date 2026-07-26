import { Button } from '@luke-ui/react/button';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default function Children() {
	return (
		<LoadingSpinner aria-label="Saving changes" isLoading>
			<Button>Save changes</Button>
		</LoadingSpinner>
	);
}
