import type { TextInput } from '@luke-ui/react/text-input';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof TextInput>('src/stories/text-input.story.tsx', {
	args: {
		initial: {
			placeholder: 'Type here...',
		},
	},
});
