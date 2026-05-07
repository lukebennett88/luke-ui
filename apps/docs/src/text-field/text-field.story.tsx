import type { TextField } from '@luke-ui/react/text-field';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof TextField>(
	new URL('./text-field.story.tsx', import.meta.url),
	{
		args: {
			initial: {
				name: 'email',
				label: 'Email',
			},
			controls: {
				transform: reorderProps([
					'name',
					'label',
					'description',
					'placeholder',
					'size',
					'isRequired',
				]),
			},
		},
	},
);
