import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Stack gap="sp16" maxInlineSize="28rem">
			<Checkbox isSelected={isLoading} label="Show loading state" onChange={setIsLoading} />
			<Text>
				<LoadingSkeleton isLoading={isLoading}>
					This text wraps across several lines to show how the skeleton follows the final content.
				</LoadingSkeleton>
			</Text>
		</Stack>
	);
};
