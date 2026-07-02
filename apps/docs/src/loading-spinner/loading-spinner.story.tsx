import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { LoadingSpinnerProps } from '@luke-ui/react/loading-spinner';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type LoadingSpinnerStoryProps = Pick<
	LoadingSpinnerProps,
	'aria-label' | 'value' | 'size' | 'color'
>;

function LoadingSpinnerPlayground(props: LoadingSpinnerStoryProps) {
	return (
		<StoryWrapper>
			<LoadingSpinner {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: LoadingSpinnerPlayground,
	args: {
		initial: { 'aria-label': 'Loading' },
	},
});
