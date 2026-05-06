import { createStoryClient } from '@fumadocs/story/client';
import { Icon } from '@luke-ui/react/icon';
import type { story } from './icon.story';

export const storyClient = createStoryClient<typeof story>({
	Component: Icon,
});
