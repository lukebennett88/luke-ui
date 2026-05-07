import { IconButton } from '@luke-ui/react/icon-button';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './icon-button.story';

export const storyClient = createWrappedStoryClient<typeof story>(IconButton);
