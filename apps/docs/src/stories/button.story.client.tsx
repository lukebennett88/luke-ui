import { createStoryClient } from '@fumadocs/story/client';
import { Button } from '@luke-ui/react/button';
import type { story } from './button.story';

export const storyClient = createStoryClient<typeof story>({
	Component: Button,
});
