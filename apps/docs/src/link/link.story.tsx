import type { Link } from '@luke-ui/react/link';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof Link>(new URL('./link.story.tsx', import.meta.url), {
	args: {
		initial: {
			href: '#',
			children: 'Link',
		},
		controls: {
			transform: reorderProps(['children', 'href', 'tone', 'isStandalone']),
		},
	},
});
