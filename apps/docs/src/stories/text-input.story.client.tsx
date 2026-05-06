import { createStoryClient } from '@fumadocs/story/client';
import { TextInput } from '@luke-ui/react/text-input';
import type { story } from './text-input.story';

export const storyClient = createStoryClient<typeof story>({
	Component: TextInput,
});
