import type { Link } from '@luke-ui/react/link';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof Link>(import.meta.url, {
	initial: { children: 'Link', href: '#' },
	priorities: ['children', 'href', 'tone', 'isStandalone'],
});
