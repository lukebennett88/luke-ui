import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';

export default function ProviderSkeleton() {
	return (
		<Box
			display="grid"
			gap="600"
			inlineSize="100%"
			maxInlineSize="32rem"
			style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}
		>
			<LoadingSkeletonProvider isLoading>
				<Box display="grid" gap="300">
					<Text fontWeight="emphasis">Provider: true</Text>
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							No local prop
						</Text>
						<Text>
							<LoadingSkeleton>Content</LoadingSkeleton>
						</Text>
					</Box>
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							isLoading
						</Text>
						<Text>
							<LoadingSkeleton isLoading>Content</LoadingSkeleton>
						</Text>
					</Box>
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							isLoading=false
						</Text>
						<Text>
							<LoadingSkeleton isLoading={false}>Content</LoadingSkeleton>
						</Text>
					</Box>
				</Box>
			</LoadingSkeletonProvider>
			<LoadingSkeletonProvider isLoading={false}>
				<Box display="grid" gap="300">
					<Text fontWeight="emphasis">Provider: false</Text>
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							No local prop
						</Text>
						<Text>
							<LoadingSkeleton>Content</LoadingSkeleton>
						</Text>
					</Box>
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							isLoading
						</Text>
						<Text>
							<LoadingSkeleton isLoading>Content</LoadingSkeleton>
						</Text>
					</Box>
					<Box display="grid" gap="100">
						<Text color="secondary" size="100">
							isLoading=false
						</Text>
						<Text>
							<LoadingSkeleton isLoading={false}>Content</LoadingSkeleton>
						</Text>
					</Box>
				</Box>
			</LoadingSkeletonProvider>
		</Box>
	);
}
