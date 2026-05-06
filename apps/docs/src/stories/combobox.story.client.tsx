import { createStoryClient } from '@fumadocs/story/client';
import { ComboboxInput } from '@luke-ui/react/combobox';
import type { story } from './combobox.story';

export const storyClient = createStoryClient<typeof story>({
	Component: ComboboxInput,
});
