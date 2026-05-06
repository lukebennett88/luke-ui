import type { Button } from '@luke-ui/react/button';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof Button>('src/stories/button.story.tsx', {
	args: {
		initial: {
			children: 'Button',
		},
	},
});
