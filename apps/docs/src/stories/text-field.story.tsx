import type { TextField } from '@luke-ui/react/text-field';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof TextField>('src/stories/text-field.story.tsx', {
	args: {
		initial: {
			name: 'email',
			label: 'Email',
		},
	},
});
