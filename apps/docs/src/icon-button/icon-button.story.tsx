import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { IconButtonProps } from '@luke-ui/react/icon-button';
import { IconButton } from '@luke-ui/react/icon-button';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type IconButtonStoryProps = Pick<
	IconButtonProps,
	'icon' | 'aria-label' | 'tone' | 'size' | 'isDisabled'
>;

function IconButtonPlayground(props: IconButtonStoryProps) {
	return (
		<StoryWrapper>
			<IconButton {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: IconButtonPlayground,
	args: {
		initial: { 'aria-label': 'Add', icon: 'add' },
	},
});
