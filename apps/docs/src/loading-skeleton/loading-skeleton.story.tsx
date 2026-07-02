import type { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { defineComponentStory } from '../lib/define-component-story';

export const story = defineComponentStory<typeof LoadingSkeleton>(import.meta.url, {
	initial: {
		children:
			'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quisquam illum enim quo impedit obcaecati, facere, quod iusto harum officia accusantium facilis. Asperiores repudiandae, amet veniam deserunt exercitationem dolorum corrupti officia?',
	},
	priorities: ['children', 'isLoading', 'as', 'borderRadius'],
});
