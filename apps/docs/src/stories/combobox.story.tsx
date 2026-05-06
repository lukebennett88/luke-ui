import type { ComboboxInput } from '@luke-ui/react/combobox';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof ComboboxInput>('src/stories/combobox.story.tsx', {
	args: {
		initial: {
			'aria-label': 'Select an item',
		},
	},
});
