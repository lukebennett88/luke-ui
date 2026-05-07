import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './loading-spinner.story';

export const storyClient = createWrappedStoryClient<typeof story>(LoadingSpinner);
