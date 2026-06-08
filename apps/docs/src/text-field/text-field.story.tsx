import type { TextField } from '@luke-ui/react/text-field';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof TextField>(import.meta.url, {
	initial: { label: 'Email', name: 'email' },
	priorities: ['name', 'label', 'description', 'placeholder', 'size', 'isRequired'],
});
