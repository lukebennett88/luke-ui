import type { Icon } from '@luke-ui/react/icon';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof Icon>('src/stories/icon.story.tsx', {
	args: {
		initial: {
			name: 'add',
			title: 'Add',
		},
	},
});
