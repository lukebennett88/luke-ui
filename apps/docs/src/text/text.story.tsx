import type { Text } from '@luke-ui/react/text';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof Text>(import.meta.url, {
	initial: { children: 'The quick brown fox jumps over the lazy dog.' },
	priorities: ['children', 'fontSize', 'lineHeight', 'color', 'fontFamily', 'fontWeight'],
});
