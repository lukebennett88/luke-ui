import type { Text } from '@luke-ui/react/text';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof Text>(new URL('./text.story.tsx', import.meta.url), {
	args: {
		initial: {
			children: 'The quick brown fox jumps over the lazy dog.',
		},
		controls: {
			transform: reorderProps([
				'children',
				'fontSize',
				'lineHeight',
				'color',
				'fontFamily',
				'fontWeight',
			]),
		},
	},
});
