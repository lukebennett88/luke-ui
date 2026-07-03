import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { IconProps } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type IconStoryProps = Pick<IconProps, 'name' | 'size' | 'title'>;

function IconPlayground(props: IconStoryProps) {
	return (
		<StoryWrapper>
			<Icon {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	args: {
		initial: { name: 'add', title: 'Add' },
	},
	Component: IconPlayground,
});
