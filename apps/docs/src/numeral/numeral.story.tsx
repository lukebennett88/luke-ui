import type { Numeral } from '@luke-ui/react/numeral';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof Numeral>(
	new URL('./numeral.story.tsx', import.meta.url),
	{
		initial: { value: 12345.67 },
		priorities: ['value', 'format', 'currency', 'precision', 'abbreviate'],
	},
);
