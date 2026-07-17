import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { useState } from 'react';

export default function CustomDimensions() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box alignItems="center" display="flex" flexWrap="wrap" gap="400">
			<LoadingSkeleton isLoading={isLoading}>
				<Box blockSize="3rem" inlineSize="3rem" style={{ borderRadius: '9999px' }} />
			</LoadingSkeleton>
			<LoadingSkeleton isLoading={isLoading}>
				<Box blockSize="3rem" inlineSize="12rem" style={{ borderRadius: '0.5rem' }} />
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
