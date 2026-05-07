import type { Icon } from '@luke-ui/react/icon';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof Icon>(
	new URL('./icon.story.tsx', import.meta.url),
	{
		initial: { name: 'add', title: 'Add' },
		priorities: ['name', 'size', 'title'],
	},
);
