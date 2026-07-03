import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { LoadingSkeletonProps } from '@luke-ui/react/loading-skeleton';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type LoadingSkeletonStoryProps = Pick<
	LoadingSkeletonProps,
	'children' | 'isLoading' | 'as' | 'borderRadius'
>;

function LoadingSkeletonPlayground(props: LoadingSkeletonStoryProps) {
	return (
		<StoryWrapper>
			<div style={{ maxWidth: '30ch' }}>
				<Text>
					<LoadingSkeleton {...props} />
				</Text>
			</div>
		</StoryWrapper>
	);
}

export const story = defineStory({
	args: {
		initial: {
			children: 'A short paragraph of placeholder copy that wraps across two lines.',
		},
	},
	Component: LoadingSkeletonPlayground,
});
