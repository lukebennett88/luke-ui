import type { CloseButton } from '@luke-ui/react/close-button';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof CloseButton>(
	new URL('./close-button.story.tsx', import.meta.url),
	{
		initial: {},
		priorities: ['tone', 'size', 'isDisabled'],
	},
);
