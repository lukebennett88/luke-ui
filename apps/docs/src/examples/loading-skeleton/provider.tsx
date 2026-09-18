import { Checkbox } from '@luke-ui/react/checkbox';
import { Code } from '@luke-ui/react/code';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

export default () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<Stack gap="sp16" maxInlineSize="28rem">
			<Checkbox isSelected={isLoading} onChange={setIsLoading}>
				Show loading state
			</Checkbox>
			<LoadingSkeletonProvider isLoading={isLoading}>
				<Stack gap="sp8">
					<Text>
						<LoadingSkeleton>
							This skeleton uses the loading state from its provider.
						</LoadingSkeleton>
					</Text>
					<Text>
						<LoadingSkeleton isLoading={false}>
							This skeleton has <Code>isLoading</Code> explicitly set to <Code>false</Code>, so
							remains visible while its provider is loading.
						</LoadingSkeleton>
					</Text>
				</Stack>
			</LoadingSkeletonProvider>
		</Stack>
	);
};
