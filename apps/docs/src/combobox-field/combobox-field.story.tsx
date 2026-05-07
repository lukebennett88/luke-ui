import type { ComboboxFieldProps } from '@luke-ui/react/combobox-field';
import type { FC } from 'react';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export type ComboboxFieldStoryProps<T extends object> = Pick<
	ComboboxFieldProps<T>,
	'label' | 'name' | 'placeholder' | 'description' | 'isRequired' | 'isDisabled' | 'size'
>;

export const story = defineStory<FC<ComboboxFieldStoryProps<any>>>(
	new URL('./combobox-field.story.tsx', import.meta.url),
	{
		args: {
			initial: {
				label: 'Country',
				name: 'country',
				placeholder: 'Select a country...',
			},
			controls: {
				transform: reorderProps(['name', 'label', 'placeholder', 'description', 'isRequired']),
			},
		},
	},
);
