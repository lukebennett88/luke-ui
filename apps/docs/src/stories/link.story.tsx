import type { Link } from '@luke-ui/react/link';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof Link>('src/stories/link.story.tsx', {
	args: {
		initial: {
			href: '#',
			children: 'Link',
		},
	},
});
