import type { IconButton } from '@luke-ui/react/icon-button';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof IconButton>(import.meta.url, {
	initial: { icon: 'add', 'aria-label': 'Add' },
	priorities: ['icon', 'aria-label', 'tone', 'size', 'isDisabled'],
});
