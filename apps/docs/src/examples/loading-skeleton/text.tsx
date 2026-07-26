import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default function TextSkeleton() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="grid" gap="400" maxInlineSize="32rem">
			<Text>
				<LoadingSkeleton isLoading={isLoading}>
					The placeholder follows each line of text as this sentence wraps.
				</LoadingSkeleton>
			</Text>
			<label>
				<Box alignItems="center" display="flex" gap="200">
					<input
						checked={isLoading}
						onChange={(event) => setIsLoading(event.target.checked)}
						type="checkbox"
					/>
					Loading
				</Box>
			</label>
		</Box>
	);
}
