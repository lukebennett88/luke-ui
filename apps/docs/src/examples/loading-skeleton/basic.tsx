import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default function Basic() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="grid" gap="400" maxInlineSize="32rem">
			<label>
				<input
					checked={isLoading}
					onChange={(event) => setIsLoading(event.target.checked)}
					type="checkbox"
				/>{' '}
				isLoading
			</label>
			<Text>
				<LoadingSkeleton isLoading={isLoading}>
					Three projects are ready for review.
				</LoadingSkeleton>
			</Text>
		</Box>
	);
}
