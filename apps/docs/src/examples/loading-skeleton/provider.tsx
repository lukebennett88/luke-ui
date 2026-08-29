import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Box display="grid" gap="sp16">
			<LoadingSkeletonProvider isLoading={isLoading}>
				<Box display="flex" flexWrap="wrap" gap="sp16">
					<Box display="grid" gap="sp4">
						<Text color="secondary" typography="caption">
							No local prop
						</Text>
						<Text>
							<LoadingSkeleton>Three items match your search.</LoadingSkeleton>
						</Text>
					</Box>
					<Box display="grid" gap="sp4">
						<Text color="secondary" typography="caption">
							isLoading
						</Text>
						<Text>
							<LoadingSkeleton isLoading>Results updated a moment ago.</LoadingSkeleton>
						</Text>
					</Box>
					<Box display="grid" gap="sp4">
						<Text color="secondary" typography="caption">
							{'isLoading={false}'}
						</Text>
						<Text>
							<LoadingSkeleton isLoading={false}>Nothing else to show.</LoadingSkeleton>
						</Text>
					</Box>
				</Box>
			</LoadingSkeletonProvider>
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Provider loading
			</Checkbox>
		</Box>
	);
};
