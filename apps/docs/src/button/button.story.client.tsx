import { Button } from '@luke-ui/react/button';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './button.story';

export const storyClient = createWrappedStoryClient<typeof story>(Button);
