import type { Heading } from '@luke-ui/react/heading';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof Heading>(new URL('./heading.story.tsx', import.meta.url), {
	args: {
		initial: {
			children: 'Heading text',
		},
		controls: {
			transform: reorderProps(['children', 'level', 'color', 'fontWeight']),
		},
	},
});
