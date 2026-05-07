import type { CloseButton } from '@luke-ui/react/close-button';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof CloseButton>(
	new URL('./close-button.story.tsx', import.meta.url),
	{
		args: {
			initial: {},
			controls: {
				transform: reorderProps(['tone', 'size', 'isDisabled']),
			},
		},
	},
);
