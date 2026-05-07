import type { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof LoadingSpinner>(
	new URL('./loading-spinner.story.tsx', import.meta.url),
	{
		args: {
			initial: {
				'aria-label': 'Loading',
			},
			controls: {
				transform: reorderProps(['aria-label', 'size']),
			},
		},
	},
);
