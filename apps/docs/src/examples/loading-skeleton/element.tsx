import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { useState } from 'react';

export default function ElementSkeleton() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<ul style={{ display: 'grid', gap: '0.5rem', margin: 0, paddingInlineStart: '1.25rem' }}>
				<LoadingSkeleton elementType="li" isLoading={isLoading}>
					Shared foundations
				</LoadingSkeleton>
				<LoadingSkeleton elementType="li" isLoading={isLoading}>
					Accessible components
				</LoadingSkeleton>
			</ul>
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
