import { Heading } from '@luke-ui/react/heading';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './heading.story';

export const storyClient = createWrappedStoryClient<typeof story>(Heading);
