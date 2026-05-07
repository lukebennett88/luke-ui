import { Icon } from '@luke-ui/react/icon';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './icon.story';

export const storyClient = createWrappedStoryClient<typeof story>(Icon);
