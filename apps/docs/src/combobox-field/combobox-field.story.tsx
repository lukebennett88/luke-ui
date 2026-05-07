import type { ComboboxFieldProps } from '@luke-ui/react/combobox-field';
import type { FC } from 'react';
import { defineComponentStory } from '../lib/define-component-story';

export type ComboboxFieldStoryProps<T extends object> = Pick<
	ComboboxFieldProps<T>,
	'label' | 'name' | 'placeholder' | 'description' | 'isRequired' | 'isDisabled' | 'size'
>;

export const story = defineComponentStory<FC<ComboboxFieldStoryProps<any>>>(import.meta.url, {
	initial: { label: 'Country', name: 'country', placeholder: 'Select a country...' },
	priorities: ['name', 'label', 'placeholder', 'description', 'isRequired'],
});
