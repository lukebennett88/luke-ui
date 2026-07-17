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
					Your application uses a shared type scale, colour system, and component library.
				</LoadingSkeleton>
			</Text>
			<LoadingSkeleton isLoading={isLoading}>
				<Text>
					Your application uses a shared type scale, colour system, and component library.
				</Text>
			</LoadingSkeleton>
			<label>
				<Box alignItems="center" display="flex" gap="200">
					<input
						checked={isLoading}
						onChange={(event) => setIsLoading(event.target.checked)}
						type="checkbox"
					/>
					Show placeholders
				</Box>
			</label>
		</Box>
	);
}
