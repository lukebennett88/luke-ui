import { defineStoryFactory } from '@fumadocs/story/vite/client';
import type { LinkProps } from '@luke-ui/react/link';
import { Link } from '@luke-ui/react/link';
import { StoryWrapper } from '../lib/story-wrapper';

const { defineStory } = defineStoryFactory();

type LinkStoryProps = Pick<LinkProps, 'children' | 'href' | 'tone' | 'isStandalone' | 'isDisabled'>;

function LinkPlayground(props: LinkStoryProps) {
	return (
		<StoryWrapper>
			<Link {...props} />
		</StoryWrapper>
	);
}

export const story = defineStory({
	Component: LinkPlayground,
	args: {
		initial: { children: 'Link', href: '#' },
	},
});
