import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default function ProviderSkeleton() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="grid" gap="400">
			<LoadingSkeletonProvider isLoading={isLoading}>
				<Box display="flex" flexWrap="wrap" gap="400">
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							No local prop
						</Text>
						<Text>
							<LoadingSkeleton>Account balance: $1,240.00</LoadingSkeleton>
						</Text>
					</Box>
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							isLoading
						</Text>
						<Text>
							<LoadingSkeleton isLoading>Next payment: 21 August</LoadingSkeleton>
						</Text>
					</Box>
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							{'isLoading={false}'}
						</Text>
						<Text>
							<LoadingSkeleton isLoading={false}>Visa ending in 4242</LoadingSkeleton>
						</Text>
					</Box>
				</Box>
			</LoadingSkeletonProvider>
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Provider loading
			</Checkbox>
		</Box>
	);
}
