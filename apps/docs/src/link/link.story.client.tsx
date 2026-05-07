import { Link } from '@luke-ui/react/link';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './link.story';

export const storyClient = createWrappedStoryClient<typeof story>(Link);
