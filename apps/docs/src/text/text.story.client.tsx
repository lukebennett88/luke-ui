import { Text } from '@luke-ui/react/text';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './text.story';

export const storyClient = createWrappedStoryClient<typeof story>(Text);
