import type { Emoji } from '@luke-ui/react/emoji';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof Emoji>(new URL('./emoji.story.tsx', import.meta.url), {
	args: {
		initial: {
			emoji: '🎉',
			label: 'Celebration',
		},
		controls: {
			transform: reorderProps(['emoji', 'label']),
		},
	},
});
