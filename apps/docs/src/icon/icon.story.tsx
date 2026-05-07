import type { Icon } from '@luke-ui/react/icon';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof Icon>(new URL('./icon.story.tsx', import.meta.url), {
	args: {
		initial: {
			name: 'add',
			title: 'Add',
		},
		controls: {
			transform: reorderProps(['name', 'size', 'title']),
		},
	},
});
