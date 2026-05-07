import type { Button } from '@luke-ui/react/button';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof Button>(
	new URL('./button.story.tsx', import.meta.url),
	{
		initial: { children: 'Button' },
		priorities: ['children', 'tone', 'size', 'isBlock', 'isDisabled', 'isPending'],
	},
);
