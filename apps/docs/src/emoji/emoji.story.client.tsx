import { Emoji } from '@luke-ui/react/emoji';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './emoji.story';

export const storyClient = createWrappedStoryClient<typeof story>(Emoji);
