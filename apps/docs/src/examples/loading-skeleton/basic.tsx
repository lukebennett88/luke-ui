import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="grid" gap="sp16" maxInlineSize="28rem">
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Show loading state
			</Checkbox>
			<Text>
				<LoadingSkeleton isLoading={isLoading}>
					This text wraps across several lines to show how the skeleton follows the final content.
				</LoadingSkeleton>
			</Text>
		</Box>
	);
};
