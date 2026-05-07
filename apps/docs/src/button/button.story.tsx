import type { Button } from '@luke-ui/react/button';
import { defineStory } from '../lib/story';
import { reorderProps } from '../lib/story-utils';

export const story = defineStory<typeof Button>(new URL('./button.story.tsx', import.meta.url), {
	args: {
		initial: {
			children: 'Button',
		},
		controls: {
			transform: reorderProps(['children', 'tone', 'size', 'isBlock', 'isDisabled', 'isPending']),
		},
	},
});
