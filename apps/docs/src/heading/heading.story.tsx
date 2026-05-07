import type { Heading } from '@luke-ui/react/heading';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof Heading>(import.meta.url, {
	initial: { children: 'Heading text' },
	priorities: ['children', 'level', 'color', 'fontWeight'],
});
