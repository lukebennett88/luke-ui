import type { IconButton } from '@luke-ui/react/icon-button';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof IconButton>(
	new URL('./icon-button.story.tsx', import.meta.url),
	{
		args: {
			initial: {
				icon: 'add',
				'aria-label': 'Add',
			},
			controls: {
				transform: reorderProps(['icon', 'aria-label', 'tone', 'size', 'isDisabled']),
			},
		},
	},
);
