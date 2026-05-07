import type { Emoji } from '@luke-ui/react/emoji';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof Emoji>(import.meta.url, {
	initial: { emoji: '🎉', label: 'Celebration' },
	priorities: ['emoji', 'label'],
});
