import type { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof LoadingSpinner>(
	new URL('./loading-spinner.story.tsx', import.meta.url),
	{
		initial: { 'aria-label': 'Loading' },
		priorities: ['aria-label', 'size'],
	},
);
