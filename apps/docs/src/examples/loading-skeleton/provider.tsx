import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default function ProviderSkeleton() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="grid" gap="400" maxInlineSize="20rem">
			<LoadingSkeletonProvider isLoading={isLoading}>
				<Text size="500">
					<LoadingSkeleton isLoading={false}>Ada Lovelace</LoadingSkeleton>
				</Text>
				<Text color="secondary">
					<LoadingSkeleton isLoading={false}>Product designer</LoadingSkeleton>
				</Text>
				<LoadingSkeleton isLoading={false}>
					<Button>Edit profile</Button>
				</LoadingSkeleton>
			</LoadingSkeletonProvider>
			<label>
				<Box alignItems="center" display="flex" gap="200">
					<input
						checked={isLoading}
						onChange={(event) => setIsLoading(event.target.checked)}
						type="checkbox"
					/>
					Show profile placeholders
				</Box>
			</label>
		</Box>
	);
}
