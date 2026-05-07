import { TextField } from '@luke-ui/react/text-field';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './text-field.story';

export const storyClient = createWrappedStoryClient<typeof story>(TextField);
