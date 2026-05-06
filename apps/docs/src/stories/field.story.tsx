import type { Field } from '@luke-ui/react/field';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof Field>('src/stories/field.story.tsx', {
	args: {
		initial: {
			label: 'Email',
			children: 'Input placeholder',
		},
	},
});
