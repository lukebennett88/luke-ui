import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';

export default () => {
	return (
		<Button
			isDisabled
			startIcon={
				<LoadingSpinner aria-label="Saving changes">
					<Icon aria-hidden name="check" />
				</LoadingSpinner>
			}
		>
			Save changes
		</Button>
	);
};
