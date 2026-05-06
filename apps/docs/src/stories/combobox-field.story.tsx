import type { ComboboxField } from '@luke-ui/react/combobox-field';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof ComboboxField>(
	'src/stories/combobox-field.story.tsx',
	{
		args: {
			initial: {
				label: 'Country',
				name: 'country',
				placeholder: 'Select a country...',
				children: 'Select',
			},
		},
	},
);
