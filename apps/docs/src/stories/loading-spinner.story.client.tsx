import { createStoryClient } from '@fumadocs/story/client';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import type { story } from './loading-spinner.story';

export const storyClient = createStoryClient<typeof story>({
	Component: LoadingSpinner,
});
