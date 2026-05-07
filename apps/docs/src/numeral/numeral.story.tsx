import type { Numeral } from '@luke-ui/react/numeral';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof Numeral>(new URL('./numeral.story.tsx', import.meta.url), {
	args: {
		initial: {
			value: 12345.67,
		},
		controls: {
			transform: reorderProps(['value', 'format', 'currency', 'precision', 'abbreviate']),
		},
	},
});
