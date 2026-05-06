import { createStoryClient } from '@fumadocs/story/client';
import { Field } from '@luke-ui/react/field';
import type { story } from './field.story';

export const storyClient = createStoryClient<typeof story>({
	Component: Field,
});
