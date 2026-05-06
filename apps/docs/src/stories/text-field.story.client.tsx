import { createStoryClient } from '@fumadocs/story/client';
import { TextField } from '@luke-ui/react/text-field';
import type { story } from './text-field.story';

export const storyClient = createStoryClient<typeof story>({
	Component: TextField,
});
