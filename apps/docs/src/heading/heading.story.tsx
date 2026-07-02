import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { HeadingProps } from '@luke-ui/react/heading';
import { Heading } from '@luke-ui/react/heading';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type HeadingStoryProps = Pick<
	HeadingProps,
	'children' | 'elementType' | 'level' | 'color' | 'fontWeight'
>;

function HeadingPlayground(props: HeadingStoryProps) {
	return (
		<StoryWrapper>
			<Heading {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: HeadingPlayground,
	args: {
		initial: { children: 'Heading text' },
	},
});
