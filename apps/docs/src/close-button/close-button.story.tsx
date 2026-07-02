import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { CloseButtonProps } from '@luke-ui/react/close-button';
import { CloseButton } from '@luke-ui/react/close-button';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type CloseButtonStoryProps = Pick<CloseButtonProps, 'tone' | 'size' | 'isDisabled'>;

function CloseButtonPlayground(props: CloseButtonStoryProps) {
	return (
		<StoryWrapper>
			<CloseButton {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: CloseButtonPlayground,
	args: {
		initial: {},
	},
});
