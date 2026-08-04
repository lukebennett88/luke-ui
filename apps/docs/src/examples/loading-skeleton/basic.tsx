import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="grid" gap="400" maxInlineSize="32rem">
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				isLoading
			</Checkbox>
			<Text>
				<LoadingSkeleton isLoading={isLoading}>
					Three projects are ready for review.
				</LoadingSkeleton>
			</Text>
		</Box>
	);
};
