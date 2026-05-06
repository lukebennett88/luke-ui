import type { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { defineStory } from '../lib/story';

export const story = defineStory<typeof LoadingSpinner>(
	'src/stories/loading-spinner.story.tsx',
	{
		args: {
			initial: {
				'aria-label': 'Loading',
			},
		},
	},
);
