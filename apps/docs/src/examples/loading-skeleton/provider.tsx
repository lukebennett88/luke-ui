import { Box } from '@luke-ui/react/box';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';

export default function ProviderSkeleton() {
	return (
		<LoadingSkeletonProvider isLoading>
			<Box display="grid" gap="200" maxInlineSize="20rem">
				<Text>
					<LoadingSkeleton isLoading={false}>Profile name</LoadingSkeleton>
				</Text>
				<Text>
					<LoadingSkeleton isLoading={false}>Profile description</LoadingSkeleton>
				</Text>
			</Box>
		</LoadingSkeletonProvider>
	);
}
