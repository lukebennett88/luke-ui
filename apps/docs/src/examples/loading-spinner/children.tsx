import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Stack } from '@luke-ui/react/stack';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Stack alignItems="flex-start" gap="sp16">
			<LoadingSpinner aria-label="Saving changes" isLoading={isLoading}>
				<Button>Save changes</Button>
			</LoadingSpinner>
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Loading
			</Checkbox>
		</Stack>
	);
};
