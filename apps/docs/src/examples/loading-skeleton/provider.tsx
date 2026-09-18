import { Checkbox } from '@luke-ui/react/checkbox';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Stack gap="sp16">
			<LoadingSkeletonProvider isLoading={isLoading}>
				<Comparison>
					<ComparisonItem label="No local prop">
						<Text>
							<LoadingSkeleton>Three items match your search.</LoadingSkeleton>
						</Text>
					</ComparisonItem>
					<ComparisonItem label="isLoading">
						<Text>
							<LoadingSkeleton isLoading>Results updated a moment ago.</LoadingSkeleton>
						</Text>
					</ComparisonItem>
					<ComparisonItem label={'isLoading={false}'}>
						<Text>
							<LoadingSkeleton isLoading={false}>Nothing else to show.</LoadingSkeleton>
						</Text>
					</ComparisonItem>
				</Comparison>
			</LoadingSkeletonProvider>
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Provider loading
			</Checkbox>
		</Stack>
	);
};
