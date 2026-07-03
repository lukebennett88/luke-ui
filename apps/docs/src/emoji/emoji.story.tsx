import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { EmojiProps } from '@luke-ui/react/emoji';
import { Emoji } from '@luke-ui/react/emoji';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type EmojiStoryProps = Pick<EmojiProps, 'emoji' | 'label'>;

function EmojiPlayground(props: EmojiStoryProps) {
	return (
		<StoryWrapper>
			<Emoji {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	args: {
		initial: { emoji: '🎉', label: 'Celebration' },
	},
	Component: EmojiPlayground,
});
