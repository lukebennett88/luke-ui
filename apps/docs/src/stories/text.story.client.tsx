import { createStoryClient } from '@fumadocs/story/client';
import { Text } from '@luke-ui/react/text';
import type { story } from './text.story';

export const storyClient = createStoryClient<typeof story>({
	Component: Text,
});
