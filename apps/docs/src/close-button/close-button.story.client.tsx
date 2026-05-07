import { CloseButton } from '@luke-ui/react/close-button';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './close-button.story';

export const storyClient = createWrappedStoryClient<typeof story>(CloseButton);
