import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { ButtonProps } from '@luke-ui/react/button';
import { Button } from '@luke-ui/react/button';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type ButtonStoryProps = Pick<
	ButtonProps,
	'children' | 'tone' | 'size' | 'isBlock' | 'isDisabled' | 'isPending'
>;

function ButtonPlayground(props: ButtonStoryProps) {
	return (
		<StoryWrapper>
			<Button {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	args: {
		initial: { children: 'Button' },
	},
	Component: ButtonPlayground,
});
