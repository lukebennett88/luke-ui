import type { Text } from '@luke-ui/react/text';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof Text>('src/stories/text.story.tsx', {
	args: {
		initial: {
			children: 'The quick brown fox jumps over the lazy dog.',
		},
	},
});
