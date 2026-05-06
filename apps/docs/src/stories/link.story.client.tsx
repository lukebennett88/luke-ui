import { createStoryClient } from '@fumadocs/story/client';
import { Link } from '@luke-ui/react/link';
import type { story } from './link.story';

export const storyClient = createStoryClient<typeof story>({
	Component: Link,
});
